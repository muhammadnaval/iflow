<?php

namespace App\Services;

use App\Events\PresenceRecorded;
use App\Models\AcademicYear;
use App\Models\AttendanceLog;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;

class PresenceService
{
    /**
     * Record a student presence from QR scan or manual NISN lookup.
     */
    public function recordPresence(string $rawNisn, int $userId, ?string $customTime = null): array
    {
        // 1. Sanitize payload
        $nisn = trim(str_ireplace(['I-FLOW:', 'DZUHURSCAN:'], '', $rawNisn));
        $today = Carbon::today()->format('Y-m-d');
        $currentTime = $customTime ? Carbon::parse($customTime) : Carbon::now();
        $scannedAtTime = $currentTime->format('H:i:s');

        // 2. Fetch Active Academic Year
        $activeYear = AcademicYear::active()->first();
        if (! $activeYear) {
            return [
                'success' => false,
                'status' => 'ERROR',
                'http_code' => 400,
                'message' => 'Tahun ajaran aktif belum dikonfigurasi.',
                'data' => null,
            ];
        }

        // 3. Find Active Student
        $student = Student::active()
            ->where('nisn', $nisn)
            ->whereHas('studentAcademicYears', function ($query) use ($activeYear) {
                $query->where('academic_year_id', $activeYear->id);
            })
            ->first();

        if (! $student) {
            return [
                'success' => false,
                'status' => 'NOT_FOUND',
                'http_code' => 404,
                'message' => "Siswa dengan NISN [{$nisn}] tidak terdaftar aktif pada tahun ajaran ini.",
                'data' => [
                    'nisn' => $nisn,
                    'scanned_at' => $scannedAtTime,
                ],
            ];
        }

        // 4. Officer Assigned Classes Check
        $scannerUser = User::find($userId);
        if ($scannerUser && ! $scannerUser->canScanClass($student->grade)) {
            $assignedText = ! empty($scannerUser->assigned_classes)
                ? implode(', ', $scannerUser->assigned_classes)
                : 'Belum ditentukan';

            return [
                'success' => false,
                'status' => 'WRONG_CLASS',
                'http_code' => 422,
                'message' => "Siswa {$student->full_name} terdaftar di kelas {$student->grade}, sedangkan penugasan Anda hanya untuk kelas [{$assignedText}].",
                'data' => [
                    'student' => [
                        'id' => $student->id,
                        'nisn' => $student->nisn,
                        'full_name' => $student->full_name,
                        'grade' => $student->grade,
                        'gender' => $student->gender,
                    ],
                    'assigned_classes' => $scannerUser->assigned_classes,
                    'scanned_at' => $scannedAtTime,
                ],
            ];
        }

        // 5. Duplicate Check (FR-06)
        $existingLog = AttendanceLog::where('student_id', $student->id)
            ->where('academic_year_id', $activeYear->id)
            ->where('attendance_date', $today)
            ->first();

        if ($existingLog) {
            return [
                'success' => false,
                'status' => 'DUPLICATE',
                'http_code' => 409,
                'message' => "Siswa {$student->full_name} sudah tercatat presensi hari ini.",
                'data' => [
                    'student' => [
                        'id' => $student->id,
                        'nisn' => $student->nisn,
                        'full_name' => $student->full_name,
                        'grade' => $student->grade,
                        'gender' => $student->gender,
                    ],
                    'status' => 'DUPLICATE',
                    'existing_record' => [
                        'status' => $existingLog->status,
                        'scanned_at' => $existingLog->scanned_at,
                    ],
                    'scanned_at' => $scannedAtTime,
                ],
            ];
        }

        // 5. Time Window Evaluation (FR-05, FR-09)
        $startTime = Carbon::createFromTimeString($activeYear->presence_start_time ?? '11:45:00');
        $endTime = Carbon::createFromTimeString($activeYear->presence_end_time ?? '12:30:00');
        $toleranceMinutes = $activeYear->late_tolerance_minutes ?? 15;
        $lateThreshold = (clone $startTime)->addMinutes($toleranceMinutes);

        $nowCompare = Carbon::createFromTimeString($scannedAtTime);

        $status = 'HADIR';
        $rejectReason = null;
        $httpCode = 200;

        if ($nowCompare->lessThan($startTime)) {
            $status = 'REJECTED';
            $rejectReason = 'Scan dilakukan sebelum jendela waktu presensi dimulai ('.$startTime->format('H:i').' WIB)';
            $httpCode = 403;
        } elseif ($nowCompare->greaterThan($endTime)) {
            $status = 'REJECTED';
            $rejectReason = 'Scan dilakukan setelah jendela waktu presensi berakhir ('.$endTime->format('H:i').' WIB)';
            $httpCode = 403;
        } elseif ($nowCompare->greaterThan($lateThreshold)) {
            $status = 'TERLAMBAT';
            $rejectReason = "Scan melebihi batas toleransi {$toleranceMinutes} menit (".$lateThreshold->format('H:i').' WIB)';
        } else {
            $status = 'HADIR';
        }

        // 6. Save Attendance Log
        $attendanceLog = AttendanceLog::create([
            'student_id' => $student->id,
            'academic_year_id' => $activeYear->id,
            'scanned_by_user_id' => $userId,
            'attendance_date' => $today,
            'scanned_at' => $scannedAtTime,
            'status' => $status,
            'reject_reason' => $rejectReason,
        ]);

        // 7. Broadcast Realtime Event (FR-07)
        try {
            event(new PresenceRecorded($attendanceLog));
        } catch (\Throwable $e) {
            // Log warning if broadcast fails gracefully
        }

        $message = match ($status) {
            'HADIR' => "Presensi berhasil — Ananda {$student->full_name}",
            'TERLAMBAT' => "Presensi tercatat (TERLAMBAT) — Ananda {$student->full_name}",
            default => "Presensi ditolak — {$rejectReason}",
        };

        return [
            'success' => $status !== 'REJECTED',
            'status' => $status,
            'http_code' => $httpCode,
            'message' => $message,
            'data' => [
                'id' => $attendanceLog->id,
                'student' => [
                    'id' => $student->id,
                    'nisn' => $student->nisn,
                    'full_name' => $student->full_name,
                    'grade' => $student->grade,
                    'gender' => $student->gender,
                ],
                'status' => $status,
                'scanned_at' => $scannedAtTime,
                'scanned_by' => $scannerUser?->name ?? 'Petugas Piket',
                'reject_reason' => $rejectReason,
            ],
        ];
    }
}
