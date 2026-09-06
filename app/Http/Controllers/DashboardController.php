<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\AttendanceLog;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the Realtime Presence Dashboard.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $today = Carbon::today()->format('Y-m-d');
        $activeYear = AcademicYear::active()->first();

        // 1. Total Active Students
        $totalStudents = Student::active()
            ->when($activeYear, function ($q) use ($activeYear) {
                $q->whereHas('studentAcademicYears', function ($sq) use ($activeYear) {
                    $sq->where('academic_year_id', $activeYear->id);
                });
            })
            ->count();

        // 2. Today's Attendance Logs
        $todayLogsQuery = AttendanceLog::with(['student', 'scannedByUser'])
            ->where('attendance_date', $today)
            ->when($activeYear, function ($q) use ($activeYear) {
                $q->where('academic_year_id', $activeYear->id);
            });

        $todayLogs = (clone $todayLogsQuery)->orderBy('scanned_at', 'desc')->get();

        $totalHadir = $todayLogs->where('status', 'HADIR')->count();
        $totalTerlambat = $todayLogs->where('status', 'TERLAMBAT')->count();
        $totalRecorded = $totalHadir + $totalTerlambat;
        $totalBelumHadir = max(0, $totalStudents - $totalRecorded);
        $percentage = $totalStudents > 0 ? round(($totalRecorded / $totalStudents) * 100, 1) : 0;

        $recentScans = $todayLogs->map(function ($log) {
            return [
                'id' => $log->id,
                'student_id' => $log->student_id,
                'nisn' => $log->student?->nisn,
                'student_name' => $log->student?->full_name,
                'class' => $log->student?->grade,
                'gender' => $log->student?->gender,
                'status' => $log->status,
                'scanned_at' => is_string($log->scanned_at) ? $log->scanned_at : date('H:i:s', strtotime($log->scanned_at)),
                'scanned_by' => $log->scannedByUser?->name ?? 'Petugas Piket',
                'reject_reason' => $log->reject_reason,
            ];
        })->values();

        $presenceWindow = [
            'start_time' => $activeYear?->presence_start_time ?? '11:45:00',
            'end_time' => $activeYear?->presence_end_time ?? '12:30:00',
            'late_tolerance_minutes' => $activeYear?->late_tolerance_minutes ?? 15,
        ];

        $payload = [
            'total_students' => $totalStudents,
            'total_present' => $totalHadir,
            'total_late' => $totalTerlambat,
            'total_absent' => $totalBelumHadir,
            'percentage' => $percentage,
            'recent_scans' => $recentScans,
            'presence_window' => $presenceWindow,
            'academic_year' => $activeYear?->name ?? '2025/2026',
        ];

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $payload,
            ]);
        }

        return Inertia::render('Dashboard/Index', [
            'stats' => $payload,
            'initialScans' => $recentScans,
        ]);
    }

    /**
     * Update/correct an attendance log status.
     */
    public function updateAttendance(Request $request, AttendanceLog $attendanceLog): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        $role = $user ? strtoupper($user->role) : 'GUEST';

        if ($role === 'KEPALA') {
            abort(403, 'Akses ditolak: Kepala Madrasah hanya memiliki hak pantau (read-only).');
        }

        $validated = $request->validate([
            'status' => 'required|in:HADIR,TERLAMBAT',
            'reject_reason' => 'nullable|string|max:255',
        ]);

        $attendanceLog->update([
            'status' => $validated['status'],
            'reject_reason' => $validated['reject_reason'] ?? $attendanceLog->reject_reason,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Status presensi siswa berhasil dikoreksi.',
                'data' => $attendanceLog,
            ]);
        }

        return redirect()->back()->with('success', 'Status presensi siswa berhasil dikoreksi.');
    }

    /**
     * Delete/cancel an attendance log.
     */
    public function destroyAttendance(Request $request, AttendanceLog $attendanceLog): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        $role = $user ? strtoupper($user->role) : 'GUEST';

        if ($role === 'KEPALA') {
            abort(403, 'Akses ditolak: Kepala Madrasah hanya memiliki hak pantau (read-only).');
        }

        $attendanceLog->delete();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Rekaman presensi siswa berhasil dibatalkan.',
            ]);
        }

        return redirect()->back()->with('success', 'Rekaman presensi siswa berhasil dibatalkan.');
    }
}
