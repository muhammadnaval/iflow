<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\AttendanceLog;
use App\Models\Student;
use App\Models\User;
use App\Services\ReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MonthlyOfficerReportTest extends TestCase
{
    use RefreshDatabase;

    protected AcademicYear $academicYear;

    protected User $admin;

    protected User $petugas1;

    protected User $petugas2;

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
            'name' => 'Administrator Utama',
            'role' => 'ADMIN',
        ]);

        $this->petugas1 = User::factory()->create([
            'name' => 'Ust. Ahmad Dahlan',
            'email' => 'ahmad@example.com',
            'role' => 'PETUGAS',
            'assigned_classes' => ['7.1', '7.2'],
        ]);

        $this->petugas2 = User::factory()->create([
            'name' => 'Ust. Hasyim Asyari',
            'email' => 'hasyim@example.com',
            'role' => 'PETUGAS',
            'assigned_classes' => ['ALL'],
        ]);
    }

    public function test_get_monthly_officer_report_aggregates_scans_correctly_for_senin_kamis(): void
    {
        $service = app(ReportService::class);

        $student1 = Student::create([
            'nisn' => '0011111001',
            'full_name' => 'Santri Satu',
            'gender' => 'L',
            'grade' => '7.1',
            'is_archived' => false,
        ]);

        $student2 = Student::create([
            'nisn' => '0011111002',
            'full_name' => 'Santri Dua',
            'gender' => 'P',
            'grade' => '7.2',
            'is_archived' => false,
        ]);

        // 1. Petugas 1 scans on Monday, 2025-01-06 (Valid) -> 2 logs HADIR
        AttendanceLog::create([
            'student_id' => $student1->id,
            'academic_year_id' => $this->academicYear->id,
            'scanned_by_user_id' => $this->petugas1->id,
            'attendance_date' => '2025-01-06',
            'scanned_at' => '12:00:00',
            'status' => 'HADIR',
        ]);
        AttendanceLog::create([
            'student_id' => $student2->id,
            'academic_year_id' => $this->academicYear->id,
            'scanned_by_user_id' => $this->petugas1->id,
            'attendance_date' => '2025-01-06',
            'scanned_at' => '12:05:00',
            'status' => 'HADIR',
        ]);

        // 2. Petugas 1 scans on Tuesday, 2025-01-07 (Valid) -> 1 log TERLAMBAT
        AttendanceLog::create([
            'student_id' => $student1->id,
            'academic_year_id' => $this->academicYear->id,
            'scanned_by_user_id' => $this->petugas1->id,
            'attendance_date' => '2025-01-07',
            'scanned_at' => '12:20:00',
            'status' => 'TERLAMBAT',
        ]);

        // 3. Petugas 1 scans on Friday, 2025-01-10 (Ignored because Friday prayer)
        AttendanceLog::create([
            'student_id' => $student1->id,
            'academic_year_id' => $this->academicYear->id,
            'scanned_by_user_id' => $this->petugas1->id,
            'attendance_date' => '2025-01-10',
            'scanned_at' => '12:00:00',
            'status' => 'HADIR',
        ]);

        // 4. Petugas 2 scans on Wednesday, 2025-01-08 (Valid) -> 1 log HADIR
        AttendanceLog::create([
            'student_id' => $student2->id,
            'academic_year_id' => $this->academicYear->id,
            'scanned_by_user_id' => $this->petugas2->id,
            'attendance_date' => '2025-01-08',
            'scanned_at' => '12:01:00',
            'status' => 'HADIR',
        ]);

        $report = $service->getMonthlyOfficerReport(1, 2025, $this->academicYear->id);

        $this->assertEquals(18, $report['effective_days']);
        $this->assertEquals(4, $report['total_scans']); // 3 from petugas1 + 1 from petugas2 (Friday ignored)
        $this->assertStringContainsString($this->petugas1->name, $report['most_active_officer']);

        $officer1Data = collect($report['data'])->firstWhere('user_id', $this->petugas1->id);
        $this->assertNotNull($officer1Data);
        $this->assertEquals(2, $officer1Data['active_days']); // Jan 6 and Jan 7
        $this->assertEquals(2, $officer1Data['total_hadir']);
        $this->assertEquals(1, $officer1Data['total_terlambat']);
        $this->assertEquals(3, $officer1Data['total_scans']);
        $this->assertEquals(1.5, $officer1Data['avg_per_day']);
        $this->assertEquals('7.1, 7.2', $officer1Data['assigned_classes']);

        $officer2Data = collect($report['data'])->firstWhere('user_id', $this->petugas2->id);
        $this->assertNotNull($officer2Data);
        $this->assertEquals(1, $officer2Data['active_days']); // Jan 8
        $this->assertEquals(1, $officer2Data['total_hadir']);
        $this->assertEquals(0, $officer2Data['total_terlambat']);
        $this->assertEquals(1, $officer2Data['total_scans']);
        $this->assertEquals(1.0, $officer2Data['avg_per_day']);
        $this->assertEquals('Semua Kelas', $officer2Data['assigned_classes']);
    }

    public function test_monthly_report_inertia_response_contains_officer_data_and_meta(): void
    {
        $response = $this->actingAs($this->admin)->get(route('reports.monthly', [
            'month' => 1,
            'year' => 2025,
            'academic_year_id' => $this->academicYear->id,
            'tab' => 'officers',
        ]));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Reports/Monthly')
            ->where('activeTab', 'officers')
            ->has('officerReportData')
            ->has('officerMeta')
            ->where('officerMeta.total_officers', 3) // admin + petugas1 + petugas2
        );
    }

    public function test_monthly_report_json_response_contains_officer_data(): void
    {
        $response = $this->actingAs($this->admin)->getJson(route('reports.monthly', [
            'month' => 1,
            'year' => 2025,
            'academic_year_id' => $this->academicYear->id,
        ]));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data',
            'officer_data',
            'meta',
            'officer_meta' => [
                'total_officers',
                'total_scans',
                'avg_scans_per_officer',
                'most_active_officer',
            ],
        ]);
    }

    public function test_export_monthly_officer_excel_streams_download(): void
    {
        $response = $this->actingAs($this->admin)->get(route('reports.monthly.officers.export', [
            'month' => 1,
            'year' => 2025,
            'academic_year_id' => $this->academicYear->id,
        ]));

        $response->assertStatus(200);
        $response->assertHeader('content-disposition', 'attachment; filename=laporan_kinerja_petugas_dzuhur_1_2025.xlsx');
    }
}
