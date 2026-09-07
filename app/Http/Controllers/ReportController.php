<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Student;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(protected ReportService $reportService) {}

    /**
     * Display Monthly Attendance Report.
     */
    public function monthly(Request $request): Response|JsonResponse
    {
        $month = (int) $request->input('month', Carbon::now()->month);
        $year = (int) $request->input('year', Carbon::now()->year);
        $grade = $request->input('class', 'ALL');
        $academicYearId = $request->input('academic_year_id') ? (int) $request->input('academic_year_id') : null;

        $academicYears = AcademicYear::orderBy('id', 'desc')->get()->map(function ($y) {
            return [
                'id' => $y->id,
                'name' => $y->name,
                'is_active' => (bool) $y->is_active,
            ];
        });

        $existingClasses = Student::query()
            ->when($academicYearId, function ($q) use ($academicYearId) {
                $q->whereHas('studentAcademicYears', function ($sq) use ($academicYearId) {
                    $sq->where('academic_year_id', $academicYearId);
                });
            })
            ->select('grade')
            ->distinct()
            ->pluck('grade')
            ->filter()
            ->values()
            ->toArray();

        $defaultClasses = [
            '7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.7', '7.8', '7.9', '7.10',
            '8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7', '8.8', '8.9', '8.10',
            '9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '9.7', '9.8', '9.9', '9.10',
            'VII-A', 'VII-B', 'VII-C', 'VIII-A', 'VIII-B', 'VIII-C', 'IX-A', 'IX-B', 'IX-C',
        ];

        $classes = array_values(array_unique(array_merge($existingClasses, $defaultClasses)));
        natsort($classes);
        $classes = array_values($classes);

        $activeTab = $request->input('tab', 'students');
        $report = $this->reportService->getMonthlyReport($month, $year, $grade, $academicYearId);
        $officerReport = $this->reportService->getMonthlyOfficerReport($month, $year, $academicYearId);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $report['data'],
                'officer_data' => $officerReport['data'],
                'meta' => [
                    'month' => $report['month'],
                    'year' => $report['year'],
                    'class' => $report['class'],
                    'academic_year_id' => $report['academic_year_id'],
                    'academic_year_name' => $report['academic_year_name'],
                    'total_school_days' => $report['effective_days'],
                    'classes' => $classes,
                ],
                'officer_meta' => [
                    'total_officers' => $officerReport['total_officers'],
                    'total_scans' => $officerReport['total_scans'],
                    'avg_scans_per_officer' => $officerReport['avg_scans_per_officer'],
                    'most_active_officer' => $officerReport['most_active_officer'],
                ],
            ]);
        }

        return Inertia::render('Reports/Monthly', [
            'reportData' => $report['data'],
            'officerReportData' => $officerReport['data'],
            'officerMeta' => [
                'total_officers' => $officerReport['total_officers'],
                'total_scans' => $officerReport['total_scans'],
                'avg_scans_per_officer' => $officerReport['avg_scans_per_officer'],
                'most_active_officer' => $officerReport['most_active_officer'],
            ],
            'activeTab' => $activeTab,
            'academicYears' => $academicYears,
            'classes' => $classes,
            'meta' => [
                'month' => $report['month'],
                'year' => $report['year'],
                'class' => $report['class'],
                'academic_year_id' => $report['academic_year_id'],
                'academic_year_name' => $report['academic_year_name'],
                'effective_days' => $report['effective_days'],
                'total_students' => $report['total_students'],
                'avg_percentage' => $report['avg_percentage'],
                'available_classes' => $classes,
            ],
        ]);
    }

    /**
     * Export Monthly Attendance to Excel (.xlsx).
     */
    public function exportExcel(Request $request): StreamedResponse
    {
        $month = (int) $request->input('month', Carbon::now()->month);
        $year = (int) $request->input('year', Carbon::now()->year);
        $grade = $request->input('class', 'ALL');
        $academicYearId = $request->input('academic_year_id') ? (int) $request->input('academic_year_id') : null;

        return $this->reportService->exportMonthlyExcel($month, $year, $grade, $academicYearId);
    }

    /**
     * Export Monthly Officer Performance to Excel (.xlsx).
     */
    public function exportOfficerExcel(Request $request): StreamedResponse
    {
        $month = (int) $request->input('month', Carbon::now()->month);
        $year = (int) $request->input('year', Carbon::now()->year);
        $academicYearId = $request->input('academic_year_id') ? (int) $request->input('academic_year_id') : null;

        return $this->reportService->exportMonthlyOfficerExcel($month, $year, $academicYearId);
    }
}
