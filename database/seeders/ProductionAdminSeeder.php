<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ProductionAdminSeeder extends Seeder
{
    /**
     * Run the production admin and baseline database seeds.
     */
    public function run(): void
    {
        // 1. Seed or Update Single Production Administrator Account
        $adminPassword = env('PRODUCTION_ADMIN_PASSWORD', 'AdminMTsN3Padang2026!');

        User::updateOrCreate(
            ['email' => 'admin@mtsn3padang.sch.id'],
            [
                'name' => 'Administrator MTsN 3 Kota Padang',
                'password' => Hash::make($adminPassword),
                'role' => 'ADMIN',
                'is_active' => true,
                'assigned_classes' => [],
            ]
        );

        // 2. Ensure Baseline Active Academic Year Exists
        AcademicYear::firstOrCreate(
            ['is_active' => true],
            [
                'name' => '2025/2026',
                'start_date' => '2025-07-15',
                'end_date' => '2026-06-20',
                'presence_start_time' => '11:45:00',
                'presence_end_time' => '12:30:00',
                'late_tolerance_minutes' => 15,
                'is_active' => true,
            ]
        );
    }
}
