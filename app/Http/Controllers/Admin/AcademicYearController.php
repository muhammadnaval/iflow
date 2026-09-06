<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Services\AcademicYearService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AcademicYearController extends Controller
{
    public function __construct(protected AcademicYearService $academicYearService) {}

    /**
     * Display academic years & presence time window configuration.
     */
    public function index(): Response
    {
        $years = AcademicYear::withCount('studentAcademicYears')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($y) {
                return [
                    'id' => $y->id,
                    'name' => $y->name,
                    'start_date' => $y->start_date?->format('Y-m-d'),
                    'end_date' => $y->end_date?->format('Y-m-d'),
                    'is_active' => (bool) $y->is_active,
                    'presence_start_time' => is_string($y->presence_start_time) ? substr($y->presence_start_time, 0, 5) : date('H:i', strtotime($y->presence_start_time)),
                    'presence_end_time' => is_string($y->presence_end_time) ? substr($y->presence_end_time, 0, 5) : date('H:i', strtotime($y->presence_end_time)),
                    'late_tolerance_minutes' => $y->late_tolerance_minutes,
                    'total_students' => $y->student_academic_years_count,
                ];
            });

        return Inertia::render('AcademicYears/Index', [
            'academicYears' => $years,
        ]);
    }

    /**
     * Create a new Academic Year.
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:20|unique:academic_years,name',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        $year = AcademicYear::create([
            'name' => $validated['name'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'is_active' => false,
            'presence_start_time' => '11:45:00',
            'presence_end_time' => '12:30:00',
            'late_tolerance_minutes' => 15,
        ]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'data' => $year]);
        }

        return redirect()->back()->with('success', 'Tahun ajaran baru berhasil ditambahkan.');
    }

    /**
     * Activate an Academic Year (FR-02).
     */
    public function activate(Request $request, AcademicYear $academicYear): RedirectResponse|JsonResponse
    {
        $this->academicYearService->activateYear($academicYear->id);

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return redirect()->back()->with('success', "Tahun ajaran {$academicYear->name} diaktifkan.");
    }

    /**
     * Update presence time window (FR-05).
     */
    public function updateTimeWindow(Request $request, AcademicYear $academicYear): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'presence_start_time' => 'required|string',
            'presence_end_time' => 'required|string',
            'late_tolerance_minutes' => 'required|integer|min:0|max:120',
        ]);

        $this->academicYearService->updateTimeWindow(
            $academicYear->id,
            $validated['presence_start_time'],
            $validated['presence_end_time'],
            $validated['late_tolerance_minutes']
        );

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return redirect()->back()->with('success', 'Konfigurasi waktu presensi berhasil disimpan.');
    }
}
