<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Services\StudentImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentImportController extends Controller
{
    public function __construct(protected StudentImportService $importService) {}

    /**
     * Display student import view.
     */
    public function index(): Response
    {
        $activeYear = AcademicYear::active()->first();

        return Inertia::render('Students/Import', [
            'activeYear' => $activeYear,
        ]);
    }

    /**
     * Parse and validate uploaded Excel file.
     */
    public function validateFile(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:5120',
        ]);

        $result = $this->importService->parseAndValidate($request->file('file'));

        return response()->json($result);
    }

    /**
     * Execute import transaction.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'valid_data' => 'required|array',
            'academic_year_id' => 'nullable|integer',
        ]);

        $result = $this->importService->executeImport(
            $request->input('valid_data'),
            $request->input('academic_year_id')
        );

        return response()->json($result);
    }

    /**
     * Download official blank Excel template.
     */
    public function downloadTemplate(): StreamedResponse
    {
        return $this->importService->downloadTemplate();
    }
}
