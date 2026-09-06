<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\AttendanceLog;
use App\Models\Student;
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

        // Calculate Effective School Days (Monday-Friday) in given month & year
        $startOfMonth = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endOfMonth = (clone $startOfMonth)->endOfMonth();
        $currentDate = (clone $startOfMonth);

        $effectiveDays = 0;
        while ($currentDate->lte($endOfMonth)) {
            if ($currentDate->isWeekday()) {
                $effectiveDays++;
            }
            $currentDate->addDay();
        }
        $effectiveDays = max(1, $effectiveDays);

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

        // Fetch attendance logs for this month, year, and academic year
        $logsQuery = AttendanceLog::whereYear('attendance_date', $year)
            ->whereMonth('attendance_date', $month)
            ->whereIn('student_id', $students->pluck('id'));

        if ($targetYear) {
            $logsQuery->where('academic_year_id', $targetYear->id);
        }

        $logs = $logsQuery->get()->groupBy('student_id');

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
        $sheet->setCellValue('A3', 'Filter Kelas: '.($grade ?: 'Semua Kelas')." | Hari Efektif: {$report['effective_days']} Hari");
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
}
