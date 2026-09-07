<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\AttendanceLog;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportService
{
    /**
     * Calculate monthly attendance metrics for students.
     */
    public function getMonthlyReport(int $month, int $year, ?string $grade = null, ?int $academicYearId = null): array
    {
        $targetYear = $academicYearId
            ? AcademicYear::find($academicYearId)
            : (AcademicYear::active()->first() ?? AcademicYear::first());

        // Calculate Effective School Days for Dzuhur prayer (Monday-Thursday only) in given month & year
        $startOfMonth = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endOfMonth = (clone $startOfMonth)->endOfMonth();
        $currentDate = (clone $startOfMonth);

        $effectiveDates = [];
        while ($currentDate->lte($endOfMonth)) {
            // Monday = 1, Tuesday = 2, Wednesday = 3, Thursday = 4 (Friday excluded for Friday prayer)
            if ($currentDate->dayOfWeekIso >= 1 && $currentDate->dayOfWeekIso <= 4) {
                $effectiveDates[] = $currentDate->format('Y-m-d');
            }
            $currentDate->addDay();
        }
        $effectiveDays = max(1, count($effectiveDates));

        // Fetch students query (including archived historical students for this academic year)
        $studentsQuery = Student::query();
        if ($grade && $grade !== 'ALL') {
            $studentsQuery->where('grade', $grade);
        }

        if ($targetYear) {
            $studentsQuery->where(function ($query) use ($targetYear, $year, $month) {
                $query->whereHas('studentAcademicYears', function ($q) use ($targetYear) {
                    $q->where('academic_year_id', $targetYear->id);
                })->orWhereHas('attendanceLogs', function ($q) use ($targetYear, $year, $month) {
                    $q->where('academic_year_id', $targetYear->id)
                        ->whereYear('attendance_date', $year)
                        ->whereMonth('attendance_date', $month);
                });
            });
        }

        $students = $studentsQuery->orderBy('grade')->orderBy('full_name')->get();

        // Fetch attendance logs strictly on Monday-Thursday for this month, year, and academic year
        $logsQuery = AttendanceLog::whereYear('attendance_date', $year)
            ->whereMonth('attendance_date', $month)
            ->whereIn('student_id', $students->pluck('id'));

        if ($targetYear) {
            $logsQuery->where('academic_year_id', $targetYear->id);
        }

        $logs = $logsQuery->get()
            ->filter(function ($log) {
                $dayOfWeek = Carbon::parse($log->attendance_date)->dayOfWeekIso;

                return $dayOfWeek >= 1 && $dayOfWeek <= 4;
            })
            ->groupBy('student_id');

        $reportData = [];
        $totalHadirAccumulator = 0;
        $totalTerlambatAccumulator = 0;
        $totalAlphaAccumulator = 0;

        foreach ($students as $student) {
            $studentLogs = $logs->get($student->id, collect());
            $hadirCount = $studentLogs->where('status', 'HADIR')->count();
            $terlambatCount = $studentLogs->where('status', 'TERLAMBAT')->count();
            $totalValidScans = $hadirCount + $terlambatCount;
            $alphaCount = max(0, $effectiveDays - $totalValidScans);

            $percentage = round(($totalValidScans / $effectiveDays) * 100, 1);

            $totalHadirAccumulator += $hadirCount;
            $totalTerlambatAccumulator += $terlambatCount;
            $totalAlphaAccumulator += $alphaCount;

            $reportData[] = [
                'student_id' => $student->id,
                'nisn' => $student->nisn,
                'name' => $student->full_name,
                'class' => $student->grade,
                'gender' => $student->gender,
                'is_archived' => (bool) $student->is_archived,
                'total_hadir' => $hadirCount,
                'total_terlambat' => $terlambatCount,
                'total_alpha' => $alphaCount,
                'total_days' => $effectiveDays,
                'percentage' => $percentage,
            ];
        }

        $avgPercentage = count($reportData) > 0
            ? round(array_sum(array_column($reportData, 'percentage')) / count($reportData), 1)
            : 0;

        return [
            'month' => $month,
            'year' => $year,
            'class' => $grade ?: 'ALL',
            'academic_year_id' => $targetYear?->id,
            'academic_year_name' => $targetYear?->name ?? '-',
            'effective_days' => $effectiveDays,
            'total_students' => count($reportData),
            'avg_percentage' => $avgPercentage,
            'data' => $reportData,
        ];
    }

    /**
     * Export monthly attendance matrix to Excel (.xlsx).
     */
    public function exportMonthlyExcel(int $month, int $year, ?string $grade = null, ?int $academicYearId = null): StreamedResponse
    {
        $report = $this->getMonthlyReport($month, $year, $grade, $academicYearId);
        $monthName = Carbon::createFromDate($year, $month, 1)->translatedFormat('F');

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle("Presensi {$monthName} {$year}");

        // Title Block
        $sheet->setCellValue('A1', 'REKAPITULASI PRESENSI SHALAT DZUHUR BERJAMAAH');
        $sheet->setCellValue('A2', 'MTsN 3 KOTA PADANG — PERIODE: '.strtoupper($monthName)." {$year}");
        $sheet->setCellValue('A3', 'Filter Kelas: '.($grade ?: 'Semua Kelas')." | Hari Efektif (Senin–Kamis): {$report['effective_days']} Hari");
        $sheet->getStyle('A1:A3')->getFont()->setBold(true);

        // Table Headers
        $headers = ['No', 'NISN', 'Nama Lengkap Siswa', 'Kelas', 'L/P', 'Hadir Tepat', 'Terlambat', 'Alpha/Izin', 'Persentase'];
        $sheet->fromArray([$headers], null, 'A5');

        // Style Header Row
        $sheet->getStyle('A5:I5')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1B5E20']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);

        $rowIdx = 6;
        foreach ($report['data'] as $idx => $r) {
            $sheet->setCellValue("A{$rowIdx}", $idx + 1);
            $sheet->setCellValueExplicit("B{$rowIdx}", $r['nisn'], DataType::TYPE_STRING);
            $sheet->setCellValue("C{$rowIdx}", $r['name']);
            $sheet->setCellValue("D{$rowIdx}", $r['class']);
            $sheet->setCellValue("E{$rowIdx}", $r['gender']);
            $sheet->setCellValue("F{$rowIdx}", $r['total_hadir']);
            $sheet->setCellValue("G{$rowIdx}", $r['total_terlambat']);
            $sheet->setCellValue("H{$rowIdx}", $r['total_alpha']);
            $sheet->setCellValue("I{$rowIdx}", "{$r['percentage']}%");
            $rowIdx++;
        }

        // Add Borders
        $sheet->getStyle('A5:I'.($rowIdx - 1))->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CCCCCC']]],
        ]);

        // Auto size columns
        foreach (range('A', 'I') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, "laporan_presensi_dzuhur_{$month}_{$year}.xlsx", [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Calculate monthly scan metrics per officer (Monday-Thursday Dzuhur scans).
     */
    public function getMonthlyOfficerReport(int $month, int $year, ?int $academicYearId = null): array
    {
        $targetYear = $academicYearId
            ? AcademicYear::find($academicYearId)
            : (AcademicYear::active()->first() ?? AcademicYear::first());

        // Effective days (Monday-Thursday only)
        $startOfMonth = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endOfMonth = (clone $startOfMonth)->endOfMonth();
        $currentDate = (clone $startOfMonth);

        $effectiveDates = [];
        while ($currentDate->lte($endOfMonth)) {
            if ($currentDate->dayOfWeekIso >= 1 && $currentDate->dayOfWeekIso <= 4) {
                $effectiveDates[] = $currentDate->format('Y-m-d');
            }
            $currentDate->addDay();
        }
        $effectiveDays = max(1, count($effectiveDates));

        // Fetch users who are PETUGAS or ADMIN, or who have attendance logs recorded
        $officers = User::query()
            ->where(function ($q) use ($year, $month, $targetYear) {
                $q->whereIn('role', ['PETUGAS', 'ADMIN'])
                    ->orWhereHas('attendanceLogs', function ($sq) use ($year, $month, $targetYear) {
                        $sq->whereYear('attendance_date', $year)
                            ->whereMonth('attendance_date', $month);
                        if ($targetYear) {
                            $sq->where('academic_year_id', $targetYear->id);
                        }
                    });
            })
            ->orderByRaw("CASE WHEN role = 'PETUGAS' THEN 1 WHEN role = 'ADMIN' THEN 2 ELSE 3 END")
            ->orderBy('name')
            ->get();

        // Fetch all attendance logs for this month and year (and target year if set)
        $logsQuery = AttendanceLog::whereYear('attendance_date', $year)
            ->whereMonth('attendance_date', $month)
            ->whereNotNull('scanned_by_user_id');

        if ($targetYear) {
            $logsQuery->where('academic_year_id', $targetYear->id);
        }

        $logs = $logsQuery->get()
            ->filter(function ($log) {
                $dayOfWeek = Carbon::parse($log->attendance_date)->dayOfWeekIso;

                return $dayOfWeek >= 1 && $dayOfWeek <= 4;
            })
            ->groupBy('scanned_by_user_id');

        $officersData = [];
        $totalScansAll = 0;
        $maxScans = -1;
        $mostActiveOfficer = '-';

        foreach ($officers as $officer) {
            $officerLogs = $logs->get($officer->id, collect());

            $activeDates = $officerLogs->pluck('attendance_date')
                ->map(fn ($d) => Carbon::parse($d)->format('Y-m-d'))
                ->unique();
            $activeDaysCount = $activeDates->count();

            $totalHadir = $officerLogs->where('status', 'HADIR')->count();
            $totalTerlambat = $officerLogs->where('status', 'TERLAMBAT')->count();
            $totalScans = $totalHadir + $totalTerlambat;
            $avgPerDay = $activeDaysCount > 0 ? round($totalScans / $activeDaysCount, 1) : 0;

            $totalScansAll += $totalScans;

            if ($totalScans > $maxScans && $totalScans > 0) {
                $maxScans = $totalScans;
                $mostActiveOfficer = "{$officer->name} ({$totalScans} scan)";
            }

            $assignedClasses = 'Semua Kelas';
            if (! empty($officer->assigned_classes) && is_array($officer->assigned_classes)) {
                $assignedClasses = in_array('ALL', $officer->assigned_classes, true)
                    ? 'Semua Kelas'
                    : implode(', ', $officer->assigned_classes);
            }

            $officersData[] = [
                'user_id' => $officer->id,
                'name' => $officer->name,
                'email' => $officer->email,
                'role' => $officer->role,
                'is_active' => (bool) $officer->is_active,
                'assigned_classes' => $assignedClasses,
                'active_days' => $activeDaysCount,
                'total_hadir' => $totalHadir,
                'total_terlambat' => $totalTerlambat,
                'total_scans' => $totalScans,
                'avg_per_day' => $avgPerDay,
            ];
        }

        $totalOfficers = count($officersData);
        $avgScansPerOfficer = $totalOfficers > 0 ? round($totalScansAll / $totalOfficers, 1) : 0;

        return [
            'month' => $month,
            'year' => $year,
            'academic_year_id' => $targetYear?->id,
            'academic_year_name' => $targetYear?->name ?? '-',
            'effective_days' => $effectiveDays,
            'total_officers' => $totalOfficers,
            'total_scans' => $totalScansAll,
            'avg_scans_per_officer' => $avgScansPerOfficer,
            'most_active_officer' => $mostActiveOfficer,
            'data' => $officersData,
        ];
    }

    /**
     * Export monthly officer scan performance report to Excel (.xlsx).
     */
    public function exportMonthlyOfficerExcel(int $month, int $year, ?int $academicYearId = null): StreamedResponse
    {
        $report = $this->getMonthlyOfficerReport($month, $year, $academicYearId);
        $monthName = Carbon::createFromDate($year, $month, 1)->translatedFormat('F');

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle("Petugas {$monthName} {$year}");

        // Title Block
        $sheet->setCellValue('A1', 'REKAPITULASI KINERJA PEMINDAIAN PETUGAS PIKET SHALAT DZUHUR');
        $sheet->setCellValue('A2', 'MTsN 3 KOTA PADANG — PERIODE: '.strtoupper($monthName)." {$year}");
        $sheet->setCellValue('A3', "Tahun Ajaran: {$report['academic_year_name']} | Hari Efektif (Senin–Kamis): {$report['effective_days']} Hari | Total Siswa Discan: {$report['total_scans']} Siswa");
        $sheet->getStyle('A1:A3')->getFont()->setBold(true);

        // Table Headers
        $headers = [
            'No',
            'Nama Petugas',
            'Email',
            'Peran',
            'Kelas Penugasan',
            'Hari Aktif Scan (Hari)',
            'Hadir Tepat',
            'Terlambat',
            'Total Siswa Discan',
            'Rata-rata / Hari',
        ];
        $sheet->fromArray([$headers], null, 'A5');

        // Style Header Row
        $sheet->getStyle('A5:J5')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1B5E20']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);

        $rowIdx = 6;
        foreach ($report['data'] as $idx => $r) {
            $sheet->setCellValue("A{$rowIdx}", $idx + 1);
            $sheet->setCellValue("B{$rowIdx}", $r['name']);
            $sheet->setCellValue("C{$rowIdx}", $r['email']);
            $sheet->setCellValue("D{$rowIdx}", $r['role']);
            $sheet->setCellValue("E{$rowIdx}", $r['assigned_classes']);
            $sheet->setCellValue("F{$rowIdx}", $r['active_days']);
            $sheet->setCellValue("G{$rowIdx}", $r['total_hadir']);
            $sheet->setCellValue("H{$rowIdx}", $r['total_terlambat']);
            $sheet->setCellValue("I{$rowIdx}", $r['total_scans']);
            $sheet->setCellValue("J{$rowIdx}", $r['avg_per_day']);
            $rowIdx++;
        }

        // Add Summary Row
        $sheet->setCellValue("A{$rowIdx}", 'TOTAL');
        $sheet->mergeCells("A{$rowIdx}:E{$rowIdx}");
        $sheet->setCellValue("F{$rowIdx}", '=AVERAGE(F6:F'.($rowIdx - 1).')');
        $sheet->setCellValue("G{$rowIdx}", '=SUM(G6:G'.($rowIdx - 1).')');
        $sheet->setCellValue("H{$rowIdx}", '=SUM(H6:H'.($rowIdx - 1).')');
        $sheet->setCellValue("I{$rowIdx}", '=SUM(I6:I'.($rowIdx - 1).')');
        $sheet->setCellValue("J{$rowIdx}", '=AVERAGE(J6:J'.($rowIdx - 1).')');
        $sheet->getStyle("A{$rowIdx}:J{$rowIdx}")->applyFromArray([
            'font' => ['bold' => true],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E8F5E9']],
        ]);
        $sheet->getStyle("A{$rowIdx}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Add Borders
        $sheet->getStyle("A5:J{$rowIdx}")->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CCCCCC']]],
        ]);

        // Auto size columns
        foreach (range('A', 'J') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, "laporan_kinerja_petugas_dzuhur_{$month}_{$year}.xlsx", [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
