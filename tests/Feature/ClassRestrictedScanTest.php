<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Student;
use App\Models\StudentAcademicYear;
use App\Models\User;
use App\Services\PresenceService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClassRestrictedScanTest extends TestCase
{
    use RefreshDatabase;

    protected AcademicYear $academicYear;

    protected Student $student7A;

    protected Student $student8B;

    protected User $officer7A;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create Active Academic Year
        $this->academicYear = AcademicYear::create([
            'name' => '2025/2026',
            'start_date' => '2025-07-15',
            'end_date' => '2026-06-20',
            'is_active' => true,
            'presence_start_time' => '11:45:00',
            'presence_end_time' => '12:30:00',
            'late_tolerance_minutes' => 15,
        ]);

        // 2. Create Students
        $this->student7A = Student::create([
            'nisn' => '0071111111',
            'full_name' => 'Ahmad Kelas 7A',
            'gender' => 'L',
            'grade' => 'VII-A',
            'is_archived' => false,
        ]);
        StudentAcademicYear::create([
            'student_id' => $this->student7A->id,
            'academic_year_id' => $this->academicYear->id,
        ]);

        $this->student8B = Student::create([
            'nisn' => '0072222222',
            'full_name' => 'Budi Kelas 8B',
            'gender' => 'L',
            'grade' => 'VIII-B',
            'is_archived' => false,
        ]);
        StudentAcademicYear::create([
            'student_id' => $this->student8B->id,
            'academic_year_id' => $this->academicYear->id,
        ]);

        // 3. Officer restricted to VII-A only
        $this->officer7A = User::create([
            'name' => 'Ustadz Petugas 7A',
            'email' => 'petugas7a@mtsn3padang.sch.id',
            'role' => 'PETUGAS',
            'assigned_classes' => ['VII-A'],
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);

        // 4. Admin (can scan all)
        $this->adminUser = User::create([
            'name' => 'Admin Madrasah',
            'email' => 'admin@mtsn3padang.sch.id',
            'role' => 'ADMIN',
            'assigned_classes' => null,
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);
    }

    public function test_officer_can_scan_student_in_assigned_class(): void
    {
        $service = app(PresenceService::class);
        $validTime = Carbon::today()->setTime(11, 50, 0)->format('H:i:s');

        $result = $service->recordPresence('0071111111', $this->officer7A->id, $validTime);

        $this->assertTrue($result['success']);
        $this->assertEquals('HADIR', $result['status']);
        $this->assertEquals(200, $result['http_code']);
    }

    public function test_officer_is_rejected_when_scanning_student_outside_assigned_class(): void
    {
        $service = app(PresenceService::class);
        $validTime = Carbon::today()->setTime(11, 50, 0)->format('H:i:s');

        // Officer 7A attempts to scan Student in 8B
        $result = $service->recordPresence('0072222222', $this->officer7A->id, $validTime);

        $this->assertFalse($result['success']);
        $this->assertEquals('WRONG_CLASS', $result['status']);
        $this->assertEquals(422, $result['http_code']);
        $this->assertStringContainsString('VIII-B', $result['message']);
        $this->assertStringContainsString('VII-A', $result['message']);
    }

    public function test_admin_can_scan_any_class_regardless_of_assignment(): void
    {
        $service = app(PresenceService::class);
        $validTime = Carbon::today()->setTime(11, 50, 0)->format('H:i:s');

        // Admin scanning Student in 8B
        $result = $service->recordPresence('0072222222', $this->adminUser->id, $validTime);

        $this->assertTrue($result['success']);
        $this->assertEquals('HADIR', $result['status']);
    }

    public function test_scan_api_endpoint_returns_422_when_class_is_mismatched(): void
    {
        $validTime = Carbon::today()->setTime(11, 50, 0)->format('Y-m-d H:i:s');

        $response = $this->actingAs($this->officer7A)
            ->postJson(route('scan.store'), [
                'nisn' => '0072222222',
            ]);

        $response->assertStatus(422);
        $response->assertJson([
            'success' => false,
            'status' => 'WRONG_CLASS',
        ]);
        $response->assertJsonPath('data.student.grade', 'VIII-B');
    }
}
