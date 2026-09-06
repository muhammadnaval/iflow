<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Student;
use App\Services\PresenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScanController extends Controller
{
    public function __construct(protected PresenceService $presenceService) {}

    /**
     * Display the mobile camera scanner view.
     */
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::active()->first();

        // Active students for quick manual lookup
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

        return Inertia::render('Scan/Index', [
            'students' => $students,
            'presenceWindow' => [
                'start_time' => $activeYear?->presence_start_time ?? '11:45:00',
                'end_time' => $activeYear?->presence_end_time ?? '12:30:00',
                'late_tolerance_minutes' => $activeYear?->late_tolerance_minutes ?? 15,
            ],
        ]);
    }

    /**
     * Process a scanned QR code or manual NISN entry.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nisn' => 'required|string',
        ]);

        $userId = $request->user()?->id ?? 2; // Default to officer if demo session

        $result = $this->presenceService->recordPresence(
            rawNisn: $request->input('nisn'),
            userId: $userId,
            customTime: $request->input('custom_time')
        );

        return response()->json($result, $result['http_code'] ?? 200);
    }
}
