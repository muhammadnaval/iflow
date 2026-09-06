<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\StudentImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class StudentImportGradeFormatTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_import_accepts_decimal_grades_and_roman_grades(): void
    {
        $service = app(StudentImportService::class);

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray([
            ['NISN', 'NAMA_LENGKAP', 'KELAS', 'JENIS_KELAMIN'],
            ['0078123401', 'Siswa Tujuh Satu', '7.1', 'L'],
            ['0078123402', 'Siswa Delapan Satu', '8.1', 'P'],
            ['0078123403', 'Siswa Sembilan Sepuluh', '9.10', 'L'],
            ['0078123404', 'Siswa Romawi Tujuh A', 'VII-A', 'P'],
            ['0078123405', 'Siswa Romawi Delapan B', 'VIII-B', 'L'],
            ['0078123406', 'Siswa Romawi Sembilan C', 'IX-C', 'P'],
        ], null, 'A1');

        $sheet->getCell('A2')->setValueExplicit('0078123401', DataType::TYPE_STRING);
        $sheet->getCell('C2')->setValueExplicit('7.1', DataType::TYPE_STRING);
        $sheet->getCell('C3')->setValueExplicit('8.1', DataType::TYPE_STRING);
        $sheet->getCell('C4')->setValueExplicit('9.10', DataType::TYPE_STRING);

        $tempPath = tempnam(sys_get_temp_dir(), 'test_student_import_').'.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempPath);

        $result = $service->parseAndValidate($tempPath);
        @unlink($tempPath);

        $this->assertEquals(6, $result['total_rows']);
        $this->assertEquals(6, $result['valid_rows']);
        $this->assertEquals(0, $result['error_rows']);
        $this->assertEquals('7.1', $result['valid_data'][0]['grade']);
        $this->assertEquals('8.1', $result['valid_data'][1]['grade']);
        $this->assertEquals('9.10', $result['valid_data'][2]['grade']);
        $this->assertEquals('VII-A', $result['valid_data'][3]['grade']);
    }

    public function test_student_import_rejects_out_of_range_or_invalid_grade_formats(): void
    {
        $service = app(StudentImportService::class);

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray([
            ['NISN', 'NAMA_LENGKAP', 'KELAS', 'JENIS_KELAMIN'],
            ['0078123411', 'Siswa Kelas Enam', '6.1', 'L'],
            ['0078123412', 'Siswa Kelas Sepuluh', '10.1', 'P'],
            ['0078123413', 'Siswa Tanpa Kelas', '', 'L'],
            ['0078123414', 'Siswa Kelas Simbol', '???', 'P'],
        ], null, 'A1');

        $tempPath = tempnam(sys_get_temp_dir(), 'test_student_import_err_').'.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempPath);

        $result = $service->parseAndValidate($tempPath);
        @unlink($tempPath);

        $this->assertEquals(4, $result['total_rows']);
        $this->assertEquals(0, $result['valid_rows']);
        $this->assertEquals(4, $result['error_rows']);
        $this->assertStringContainsString('Format kelas [6.1] tidak valid', $result['errors'][0]['reason']);
        $this->assertStringContainsString('Format kelas [10.1] tidak valid', $result['errors'][1]['reason']);
    }

    public function test_template_download_returns_xlsx(): void
    {
        $admin = User::factory()->create(['role' => 'ADMIN']);

        $response = $this->actingAs($admin)->get(route('admin.students.import.template'));

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
}
