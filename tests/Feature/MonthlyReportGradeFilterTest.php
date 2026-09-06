<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Student;
use App\Models\StudentAcademicYear;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MonthlyReportGradeFilterTest extends TestCase
{
    use RefreshDatabase;

    protected AcademicYear $academicYear;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->academicYear = AcademicYear::create([
            'name' => '2025/2026',
            'start_date' => '2025-07-15',
            'end_date' => '2026-06-20',
            'is_active' => true,
            'presence_start_time' => '11:45:00',
            'presence_end_time' => '12:30:00',
            'late_tolerance_minutes' => 15,
        ]);

        $this->admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);
    }

    public function test_monthly_report_provides_dynamic_classes_including_decimal_grades(): void
    {
        $student1 = Student::create([
            'nisn' => '0071234561',
            'full_name' => 'Siswa Tujuh Satu',
            'gender' => 'L',
            'grade' => '7.1',
            'is_archived' => false,
        ]);
        StudentAcademicYear::create([
            'student_id' => $student1->id,
            'academic_year_id' => $this->academicYear->id,
            'grade' => '7.1',
        ]);

        $student2 = Student::create([
            'nisn' => '0071234562',
            'full_name' => 'Siswa Delapan Dua',
            'gender' => 'P',
            'grade' => '8.2',
            'is_archived' => false,
        ]);
        StudentAcademicYear::create([
            'student_id' => $student2->id,
            'academic_year_id' => $this->academicYear->id,
            'grade' => '8.2',
        ]);

        $response = $this->actingAs($this->admin)->get(route('reports.monthly'));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Reports/Monthly')
            ->has('classes')
            ->where('classes', fn ($classes) => collect($classes)->contains('7.1') && collect($classes)->contains('8.2'))
        );
    }

    public function test_monthly_report_filters_students_by_decimal_grade(): void
    {
        $student71 = Student::create([
            'nisn' => '0071234571',
            'full_name' => 'Ahmad Kelas 7.1',
            'gender' => 'L',
            'grade' => '7.1',
            'is_archived' => false,
        ]);
        StudentAcademicYear::create([
            'student_id' => $student71->id,
            'academic_year_id' => $this->academicYear->id,
            'grade' => '7.1',
        ]);

        $student81 = Student::create([
            'nisn' => '0071234581',
            'full_name' => 'Budi Kelas 8.1',
            'gender' => 'L',
            'grade' => '8.1',
            'is_archived' => false,
        ]);
        StudentAcademicYear::create([
            'student_id' => $student81->id,
            'academic_year_id' => $this->academicYear->id,
            'grade' => '8.1',
        ]);

        $response = $this->actingAs($this->admin)->get(route('reports.monthly', ['class' => '7.1']));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Reports/Monthly')
            ->where('meta.class', '7.1')
            ->has('reportData', 1)
            ->where('reportData.0.nisn', $student71->nisn)
        );
    }

    public function test_monthly_report_export_excel_with_decimal_grade(): void
    {
        $student71 = Student::create([
            'nisn' => '0071234572',
            'full_name' => 'Ahmad Kelas 7.1 Export',
            'gender' => 'L',
            'grade' => '7.1',
            'is_archived' => false,
        ]);
        StudentAcademicYear::create([
            'student_id' => $student71->id,
            'academic_year_id' => $this->academicYear->id,
            'grade' => '7.1',
        ]);

        $response = $this->actingAs($this->admin)->get(route('reports.monthly.export', [
            'class' => '7.1',
            'month' => Carbon::now()->month,
            'year' => Carbon::now()->year,
        ]));

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_dashboard_provides_available_classes_including_decimal_grades(): void
    {
        $student71 = Student::create([
            'nisn' => '0071234573',
            'full_name' => 'Ahmad Dashboard',
            'gender' => 'L',
            'grade' => '7.1',
            'is_archived' => false,
        ]);
        StudentAcademicYear::create([
            'student_id' => $student71->id,
            'academic_year_id' => $this->academicYear->id,
            'grade' => '7.1',
        ]);

        $response = $this->actingAs($this->admin)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Index')
            ->has('availableClasses')
            ->where('availableClasses', fn ($classes) => collect($classes)->contains('7.1'))
        );
    }
}
