<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\AttendanceLog;
use App\Models\Student;
use App\Models\StudentAcademicYear;
use App\Models\User;
use App\Services\ReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MonthlyReportEffectiveDaysTest extends TestCase
{
    use RefreshDatabase;

    protected AcademicYear $academicYear;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->academicYear = AcademicYear::create([
            'name' => '2024/2025',
            'start_date' => '2024-07-15',
            'end_date' => '2025-06-20',
            'is_active' => true,
            'presence_start_time' => '11:45:00',
            'presence_end_time' => '12:30:00',
            'late_tolerance_minutes' => 15,
        ]);

        $this->admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);
    }

    public function test_effective_days_counts_only_monday_through_thursday(): void
    {
        $service = app(ReportService::class);

        // January 2025 has 31 days:
        // 5 Fridays, 4 Saturdays, 4 Sundays.
        // Total weekdays (Mon-Fri) = 23 days.
        // Total Monday-Thursday days = 23 - 5 = 18 days.
        $report = $service->getMonthlyReport(1, 2025, 'ALL', $this->academicYear->id);

        $this->assertEquals(18, $report['effective_days']);
    }

    public function test_friday_and_weekend_attendance_logs_are_ignored_in_monthly_report(): void
    {
        $service = app(ReportService::class);

        $student = Student::create([
            'nisn' => '0079999001',
            'full_name' => 'Fulan bin Fulan',
            'gender' => 'L',
            'grade' => '7.1',
            'is_archived' => false,
        ]);
        StudentAcademicYear::create([
            'student_id' => $student->id,
            'academic_year_id' => $this->academicYear->id,
            'grade' => '7.1',
        ]);

        // Log on Monday, 2025-01-06 (Valid effective day)
        AttendanceLog::create([
            'student_id' => $student->id,
            'academic_year_id' => $this->academicYear->id,
            'scanned_by_user_id' => $this->admin->id,
            'attendance_date' => '2025-01-06',
            'scanned_at' => '12:00:00',
            'status' => 'HADIR',
        ]);

        // Log on Friday, 2025-01-10 (Should be ignored in monthly report)
        AttendanceLog::create([
            'student_id' => $student->id,
            'academic_year_id' => $this->academicYear->id,
            'scanned_by_user_id' => $this->admin->id,
            'attendance_date' => '2025-01-10',
            'scanned_at' => '12:00:00',
            'status' => 'HADIR',
        ]);

        // Log on Sunday, 2025-01-12 (Should be ignored in monthly report)
        AttendanceLog::create([
            'student_id' => $student->id,
            'academic_year_id' => $this->academicYear->id,
            'scanned_by_user_id' => $this->admin->id,
            'attendance_date' => '2025-01-12',
            'scanned_at' => '12:00:00',
            'status' => 'HADIR',
        ]);

        $report = $service->getMonthlyReport(1, 2025, 'ALL', $this->academicYear->id);

        $this->assertCount(1, $report['data']);
        $studentData = $report['data'][0];

        $this->assertEquals(1, $studentData['total_hadir']);
        $this->assertEquals(18, $studentData['total_days']);
        $this->assertEquals(17, $studentData['total_alpha']);
        $this->assertEquals(5.6, $studentData['percentage']);
    }

    public function test_monthly_report_route_returns_revised_effective_days(): void
    {
        $response = $this->actingAs($this->admin)->get(route('reports.monthly', [
            'month' => 1,
            'year' => 2025,
            'academic_year_id' => $this->academicYear->id,
        ]));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Reports/Monthly')
            ->where('meta.effective_days', 18)
        );
    }
}
