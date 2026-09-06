<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\UserImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class UserImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_download_user_import_template(): void
    {
        $admin = User::where('role', 'ADMIN')->first() ?? User::factory()->create(['role' => 'ADMIN']);

        $response = $this->actingAs($admin)->get(route('admin.users.import.template'));

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_user_import_service_validates_rows_and_rejects_empty_password(): void
    {
        $service = app(UserImportService::class);

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray([
            ['NAMA', 'EMAIL', 'ROLE', 'PASSWORD'],
            ['Ustadz Zaid', 'zaid@mtsn3padang.sch.id', 'PETUGAS', ''], // Empty password
            ['Ustadzah Fatimah', 'fatimah@mtsn3padang.sch.id', 'PETUGAS', 'password123'], // Valid
        ], null, 'A1');

        $tempPath = tempnam(sys_get_temp_dir(), 'test_user_import_').'.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempPath);

        $result = $service->parseAndValidate($tempPath);
        @unlink($tempPath);

        $this->assertEquals(2, $result['total_rows']);
        $this->assertEquals(1, $result['valid_rows']);
        $this->assertEquals(1, $result['error_rows']);
        $this->assertStringContainsString('Password wajib diisi', $result['errors'][0]['reason']);
    }

    public function test_admin_can_execute_user_import_and_upsert(): void
    {
        $admin = User::where('role', 'ADMIN')->first() ?? User::factory()->create(['role' => 'ADMIN']);

        $payload = [
            'valid_data' => [
                [
                    'name' => 'Ustadz Baru Import',
                    'email' => 'ustadz.baru@mtsn3padang.sch.id',
                    'role' => 'PETUGAS',
                    'password' => 'secretPass123',
                ],
            ],
        ];

        $response = $this->actingAs($admin)->postJson(route('admin.users.import.store'), $payload);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        $createdUser = User::where('email', 'ustadz.baru@mtsn3padang.sch.id')->first();
        $this->assertNotNull($createdUser);
        $this->assertEquals('Ustadz Baru Import', $createdUser->name);
        $this->assertEquals('PETUGAS', $createdUser->role);
        $this->assertTrue(Hash::check('secretPass123', $createdUser->password));

        // Test Upsert: update existing user
        $upsertPayload = [
            'valid_data' => [
                [
                    'name' => 'Ustadz Baru (Updated)',
                    'email' => 'ustadz.baru@mtsn3padang.sch.id',
                    'role' => 'ADMIN',
                    'password' => 'newPassword456',
                ],
            ],
        ];

        $upsertResponse = $this->actingAs($admin)->postJson(route('admin.users.import.store'), $upsertPayload);
        $upsertResponse->assertStatus(200);

        $updatedUser = $createdUser->fresh();
        $this->assertEquals('Ustadz Baru (Updated)', $updatedUser->name);
        $this->assertEquals('ADMIN', $updatedUser->role);
        $this->assertTrue(Hash::check('newPassword456', $updatedUser->password));

        // Clean up
        $updatedUser->delete();
    }
}
