<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserEditTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $petugas;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin Utama',
            'email' => 'admin@mtsn3padang.sch.id',
            'role' => 'ADMIN',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $this->petugas = User::create([
            'name' => 'Petugas Piket Awal',
            'email' => 'petugas@mtsn3padang.sch.id',
            'role' => 'PETUGAS',
            'assigned_classes' => ['VII-A'],
            'password' => Hash::make('oldpassword123'),
            'is_active' => true,
        ]);
    }

    public function test_admin_can_update_user_details_and_classes(): void
    {
        $response = $this->actingAs($this->admin)
            ->put(route('admin.users.update', $this->petugas->id), [
                'name' => 'Ustadz Zulham Baru, M.Pd',
                'email' => 'zulham.baru@mtsn3padang.sch.id',
                'role' => 'PETUGAS',
                'assigned_classes' => ['VII-A', 'VII-B', 'VII-C'],
                'is_active' => true,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->petugas->refresh();
        $this->assertEquals('Ustadz Zulham Baru, M.Pd', $this->petugas->name);
        $this->assertEquals('zulham.baru@mtsn3padang.sch.id', $this->petugas->email);
        $this->assertEquals(['VII-A', 'VII-B', 'VII-C'], $this->petugas->assigned_classes);
        $this->assertTrue(Hash::check('oldpassword123', $this->petugas->password));
    }

    public function test_admin_can_update_user_password(): void
    {
        $response = $this->actingAs($this->admin)
            ->put(route('admin.users.update', $this->petugas->id), [
                'name' => $this->petugas->name,
                'email' => $this->petugas->email,
                'role' => 'PETUGAS',
                'password' => 'newsecretpassword',
                'assigned_classes' => ['VII-A'],
                'is_active' => true,
            ]);

        $response->assertRedirect();
        $this->petugas->refresh();
        $this->assertTrue(Hash::check('newsecretpassword', $this->petugas->password));
    }

    public function test_user_can_keep_their_existing_email(): void
    {
        $response = $this->actingAs($this->admin)
            ->put(route('admin.users.update', $this->petugas->id), [
                'name' => 'Nama Baru Petugas',
                'email' => 'petugas@mtsn3padang.sch.id', // same email
                'role' => 'PETUGAS',
                'assigned_classes' => ['VIII-A'],
                'is_active' => true,
            ]);

        $response->assertSessionHasNoErrors();
        $this->petugas->refresh();
        $this->assertEquals('Nama Baru Petugas', $this->petugas->name);
    }

    public function test_cannot_use_email_already_taken_by_another_user(): void
    {
        $response = $this->actingAs($this->admin)
            ->put(route('admin.users.update', $this->petugas->id), [
                'name' => 'Petugas Coba Curi Email',
                'email' => 'admin@mtsn3padang.sch.id', // existing email of admin
                'role' => 'PETUGAS',
                'is_active' => true,
            ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_cannot_demote_or_deactivate_last_active_admin(): void
    {
        // Attempt to demote the sole admin to PETUGAS
        $response = $this->actingAs($this->admin)
            ->put(route('admin.users.update', $this->admin->id), [
                'name' => 'Admin Utama',
                'email' => 'admin@mtsn3padang.sch.id',
                'role' => 'PETUGAS',
                'is_active' => true,
            ]);

        $response->assertSessionHasErrors('error');
        $this->admin->refresh();
        $this->assertEquals('ADMIN', $this->admin->role);

        // Attempt to deactivate the sole admin
        $responseDeactivate = $this->actingAs($this->admin)
            ->put(route('admin.users.update', $this->admin->id), [
                'name' => 'Admin Utama',
                'email' => 'admin@mtsn3padang.sch.id',
                'role' => 'ADMIN',
                'is_active' => false,
            ]);

        $responseDeactivate->assertSessionHasErrors('error');
        $this->admin->refresh();
        $this->assertTrue($this->admin->is_active);
    }
}
