<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\AttendanceLog;
use App\Models\Student;
use App\Models\StudentAcademicYear;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AttendanceCorrectionTest extends TestCase
{
    use RefreshDatabase;

    protected AcademicYear $academicYear;

    protected Student $student;

    protected User $admin;

    protected User $petugas;

    protected User $kepala;

    protected AttendanceLog $log;

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

        $this->student = Student::create([
            'nisn' => '0071234567',
            'full_name' => 'Rahmat Hidayat',
            'gender' => 'L',
            'grade' => 'VII-A',
            'is_archived' => false,
        ]);
        StudentAcademicYear::create([
            'student_id' => $this->student->id,
            'academic_year_id' => $this->academicYear->id,
        ]);

        $this->admin = User::create([
            'name' => 'Admin Madrasah',
            'email' => 'admin@mtsn3padang.sch.id',
            'role' => 'ADMIN',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $this->petugas = User::create([
            'name' => 'Ustadz Petugas',
            'email' => 'petugas@mtsn3padang.sch.id',
            'role' => 'PETUGAS',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $this->kepala = User::create([
            'name' => 'Kepala Madrasah',
            'email' => 'kepala@mtsn3padang.sch.id',
            'role' => 'KEPALA',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $this->log = AttendanceLog::create([
            'student_id' => $this->student->id,
            'academic_year_id' => $this->academicYear->id,
            'scanned_by_user_id' => $this->petugas->id,
            'attendance_date' => Carbon::today()->toDateString(),
            'scanned_at' => '12:05:00',
            'status' => 'TERLAMBAT',
            'reject_reason' => null,
        ]);
    }

    public function test_admin_can_correct_attendance_status(): void
    {
        $response = $this->actingAs($this->admin)
            ->put(route('attendance.update', $this->log->id), [
                'status' => 'HADIR',
                'reject_reason' => 'Koreksi manual: siswa hadir tepat waktu tapi antre wudhu',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->log->refresh();
        $this->assertEquals('HADIR', $this->log->status);
        $this->assertEquals('Koreksi manual: siswa hadir tepat waktu tapi antre wudhu', $this->log->reject_reason);
    }

    public function test_petugas_can_correct_attendance_status(): void
    {
        $response = $this->actingAs($this->petugas)
            ->put(route('attendance.update', $this->log->id), [
                'status' => 'HADIR',
                'reject_reason' => 'Koreksi petugas piket',
            ]);

        $response->assertRedirect();
        $this->log->refresh();
        $this->assertEquals('HADIR', $this->log->status);
    }

    public function test_kepala_cannot_correct_attendance(): void
    {
        $response = $this->actingAs($this->kepala)
            ->put(route('attendance.update', $this->log->id), [
                'status' => 'HADIR',
            ]);

        $response->assertForbidden();
        $this->log->refresh();
        $this->assertEquals('TERLAMBAT', $this->log->status);
    }

    public function test_admin_can_delete_attendance_log(): void
    {
        $response = $this->actingAs($this->admin)
            ->delete(route('attendance.destroy', $this->log->id));

        $response->assertRedirect();
        $this->assertDatabaseMissing('attendance_logs', ['id' => $this->log->id]);
    }

    public function test_petugas_can_delete_attendance_log(): void
    {
        $response = $this->actingAs($this->petugas)
            ->delete(route('attendance.destroy', $this->log->id));

        $response->assertRedirect();
        $this->assertDatabaseMissing('attendance_logs', ['id' => $this->log->id]);
    }

    public function test_kepala_cannot_delete_attendance_log(): void
    {
        $response = $this->actingAs($this->kepala)
            ->delete(route('attendance.destroy', $this->log->id));

        $response->assertForbidden();
        $this->assertDatabaseHas('attendance_logs', ['id' => $this->log->id]);
    }
}
