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

        $students = Student::active()
            ->when($activeYear, function ($q) use ($activeYear) {
                $q->whereHas('studentAcademicYears', function ($sq) use ($activeYear) {
                    $sq->where('academic_year_id', $activeYear->id);
                });
            })
            ->select('id', 'nisn', 'full_name', 'gender', 'grade')
            ->orderBy('grade')
            ->orderBy('full_name')
            ->get();

        return Inertia::render('Students/QrCards', [
            'students' => $students,
            'academicYear' => $activeYear?->name ?? '2025/2026',
        ]);
    }
}
