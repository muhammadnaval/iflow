<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
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

        $report = $this->reportService->getMonthlyReport($month, $year, $grade, $academicYearId);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $report['data'],
                'meta' => [
                    'month' => $report['month'],
                    'year' => $report['year'],
                    'class' => $report['class'],
                    'academic_year_id' => $report['academic_year_id'],
                    'academic_year_name' => $report['academic_year_name'],
                    'total_school_days' => $report['effective_days'],
                ],
            ]);
        }

        return Inertia::render('Reports/Monthly', [
            'reportData' => $report['data'],
            'academicYears' => $academicYears,
            'meta' => [
                'month' => $report['month'],
                'year' => $report['year'],
                'class' => $report['class'],
                'academic_year_id' => $report['academic_year_id'],
                'academic_year_name' => $report['academic_year_name'],
                'effective_days' => $report['effective_days'],
                'total_students' => $report['total_students'],
                'avg_percentage' => $report['avg_percentage'],
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
}
