<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicYearTimeWindowTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected User $officerUser;

    protected AcademicYear $academicYear;

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

        $this->adminUser = User::create([
            'name' => 'Admin Madrasah',
            'email' => 'admin@mtsn3padang.sch.id',
            'role' => 'ADMIN',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);

        $this->officerUser = User::create([
            'name' => 'Petugas Piket',
            'email' => 'petugas@mtsn3padang.sch.id',
            'role' => 'PETUGAS',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);
    }

    public function test_admin_can_update_tolerance_to_120_minutes(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->post(route('admin.academic-years.time-window', $this->academicYear->id), [
                'presence_start_time' => '11:45:00',
                'presence_end_time' => '14:00:00',
                'late_tolerance_minutes' => 120,
            ]);

        $response->assertSessionHasNoErrors();
        $this->academicYear->refresh();
        $this->assertEquals(120, $this->academicYear->late_tolerance_minutes);
        $this->assertEquals('11:45:00', $this->academicYear->presence_start_time);
        $this->assertEquals('14:00:00', $this->academicYear->presence_end_time);
    }

    public function test_admin_can_update_tolerance_to_maximum_240_minutes(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->post(route('admin.academic-years.time-window', $this->academicYear->id), [
                'presence_start_time' => '11:00:00',
                'presence_end_time' => '16:00:00',
                'late_tolerance_minutes' => 240,
            ]);

        $response->assertSessionHasNoErrors();
        $this->academicYear->refresh();
        $this->assertEquals(240, $this->academicYear->late_tolerance_minutes);
    }

    public function test_tolerance_above_240_minutes_fails_validation(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->post(route('admin.academic-years.time-window', $this->academicYear->id), [
                'presence_start_time' => '11:45:00',
                'presence_end_time' => '16:00:00',
                'late_tolerance_minutes' => 241,
            ]);

        $response->assertSessionHasErrors(['late_tolerance_minutes']);
        $this->academicYear->refresh();
        $this->assertEquals(15, $this->academicYear->late_tolerance_minutes);
    }

    public function test_negative_tolerance_fails_validation(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->post(route('admin.academic-years.time-window', $this->academicYear->id), [
                'presence_start_time' => '11:45:00',
                'presence_end_time' => '12:30:00',
                'late_tolerance_minutes' => -1,
            ]);

        $response->assertSessionHasErrors(['late_tolerance_minutes']);
    }

    public function test_unauthenticated_user_cannot_update_time_window(): void
    {
        $response = $this->post(route('admin.academic-years.time-window', $this->academicYear->id), [
            'presence_start_time' => '11:45:00',
            'presence_end_time' => '14:00:00',
            'late_tolerance_minutes' => 120,
        ]);

        $response->assertRedirect(route('login'));
    }
}
