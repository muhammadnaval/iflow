<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AcademicYearService
{
    /**
     * Activate an academic year and archive old students.
     */
    public function activateYear(int $academicYearId): AcademicYear
    {
        return DB::transaction(function () use ($academicYearId) {
            // Set all to inactive
            AcademicYear::where('is_active', true)->update(['is_active' => false]);

            $targetYear = AcademicYear::findOrFail($academicYearId);
            $targetYear->update(['is_active' => true]);

            // 1. Un-archive and restore active status for students linked to target year
            Student::whereHas('studentAcademicYears', function ($q) use ($academicYearId) {
                $q->where('academic_year_id', $academicYearId);
            })->update([
                'is_archived' => false,
                'archived_at' => null,
            ]);

            // 2. Soft-archive students not linked to this target year
            Student::whereDoesntHave('studentAcademicYears', function ($q) use ($academicYearId) {
                $q->where('academic_year_id', $academicYearId);
            })->update([
                'is_archived' => true,
                'archived_at' => Carbon::now(),
            ]);

            return $targetYear;
        });
    }

    /**
     * Update presence time window configuration.
     */
    public function updateTimeWindow(int $academicYearId, string $startTime, string $endTime, int $toleranceMinutes): AcademicYear
    {
        $year = AcademicYear::findOrFail($academicYearId);
        $year->update([
            'presence_start_time' => $startTime,
            'presence_end_time' => $endTime,
            'late_tolerance_minutes' => $toleranceMinutes,
        ]);

        return $year;
    }
}
