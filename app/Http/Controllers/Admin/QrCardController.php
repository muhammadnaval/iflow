<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QrCardController extends Controller
{
    /**
     * Display student QR cards print and preview page.
     */
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::active()->first();

        // 1. Fetch all distinct active classes for the active academic year
        $classes = Student::active()
            ->when($activeYear, function ($q) use ($activeYear) {
                $q->whereHas('studentAcademicYears', function ($sq) use ($activeYear) {
                    $sq->where('academic_year_id', $activeYear->id);
                });
            })
            ->select('grade')
            ->distinct()
            ->orderBy('grade')
            ->pluck('grade')
            ->toArray();

        // 2. Determine selected class (default to first available class)
        $selectedClass = $request->input('class');
        if (! $selectedClass || ! in_array($selectedClass, $classes, true)) {
            $selectedClass = $classes[0] ?? null;
        }

        // 3. Query students strictly for the selected class
        $students = Student::active()
            ->when($activeYear, function ($q) use ($activeYear) {
                $q->whereHas('studentAcademicYears', function ($sq) use ($activeYear) {
                    $sq->where('academic_year_id', $activeYear->id);
                });
            })
            ->when($selectedClass, function ($q) use ($selectedClass) {
                $q->where('grade', $selectedClass);
            })
            ->select('id', 'nisn', 'full_name', 'gender', 'grade')
            ->orderBy('full_name')
            ->get();

        return Inertia::render('Students/QrCards', [
            'students' => $students,
            'classes' => $classes,
            'selectedClass' => $selectedClass,
            'academicYear' => $activeYear?->name ?? '2025/2026',
        ]);
    }
}
