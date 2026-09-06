<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Student;
use App\Models\StudentAcademicYear;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentImportService
{
    /**
     * Parse and validate an uploaded Excel file.
     *
     * @param  UploadedFile|string  $file
     */
    public function parseAndValidate($file, ?int $academicYearId = null): array
    {
        $filePath = is_string($file) ? $file : $file->getRealPath();
        $spreadsheet = IOFactory::load($filePath);
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray(null, true, true, true);

        if (count($rows) < 2) {
            return [
                'success' => false,
                'total_rows' => 0,
                'valid_rows' => 0,
                'error_rows' => 1,
                'errors' => [['row' => 1, 'nisn' => '-', 'name' => '-', 'reason' => 'Berkas Excel kosong atau tidak memiliki baris data.']],
                'preview_rows' => [],
            ];
        }

        // Validate Header (Row 1)
        $header = array_map('trim', array_map('strtoupper', array_values($rows[1] ?? [])));
        $expected = ['NISN', 'NAMA_LENGKAP', 'KELAS', 'JENIS_KELAMIN'];

        // Normalize header check
        $colA = strtoupper(trim($rows[1]['A'] ?? ''));
        $colB = strtoupper(trim($rows[1]['B'] ?? ''));
        $colC = strtoupper(trim($rows[1]['C'] ?? ''));
        $colD = strtoupper(trim($rows[1]['D'] ?? ''));

        if (! str_contains($colA, 'NISN') || ! str_contains($colB, 'NAMA') || ! str_contains($colC, 'KELAS') || ! str_contains($colD, 'JENIS')) {
            return [
                'success' => false,
                'total_rows' => 0,
                'valid_rows' => 0,
                'error_rows' => 1,
                'errors' => [['row' => 1, 'nisn' => '-', 'name' => '-', 'reason' => 'Header kolom tidak sesuai template resmi. Wajib: NISN, NAMA_LENGKAP, KELAS, JENIS_KELAMIN.']],
                'preview_rows' => [],
            ];
        }

        $validData = [];
        $errors = [];
        $seenNisns = [];
        $previewRows = [];

        $totalDataRows = 0;

        for ($i = 2; $i <= count($rows); $i++) {
            $row = $rows[$i] ?? [];
            $nisn = trim((string) ($row['A'] ?? ''));
            $fullName = trim((string) ($row['B'] ?? ''));
            $grade = strtoupper(trim((string) ($row['C'] ?? '')));
            $gender = strtoupper(trim((string) ($row['D'] ?? '')));

            // Skip completely empty rows
            if ($nisn === '' && $fullName === '' && $grade === '' && $gender === '') {
                continue;
            }

            $totalDataRows++;
            $rowErrors = [];

            // 1. NISN validation (10 digits numeric)
            if ($nisn === '') {
                $rowErrors[] = 'NISN tidak boleh kosong';
            } elseif (! preg_match('/^\d{10}$/', $nisn)) {
                $rowErrors[] = "NISN [{$nisn}] harus 10 digit angka numerik";
            } elseif (isset($seenNisns[$nisn])) {
                $rowErrors[] = "NISN [{$nisn}] duplikat dengan baris {$seenNisns[$nisn]} di berkas yang sama";
            } else {
                $seenNisns[$nisn] = $i;
            }

            // 2. Full Name validation
            if ($fullName === '' || mb_strlen($fullName) < 3) {
                $rowErrors[] = 'Nama lengkap wajib diisi minimal 3 karakter';
            }

            // 3. Class Grade validation (e.g. 7.1, 8.1, 9.1, VII-A, VIII-B, IX-C)
            if ($grade === '' || ! preg_match('/^(7|8|9|VII|VIII|IX)[-._\s]?[A-Z0-9]+$/i', $grade)) {
                $rowErrors[] = "Format kelas [{$grade}] tidak valid (Gunakan pola 7.1 s.d 9.12 atau VII-A s.d IX-Z)";
            }

            // 4. Gender validation (L or P)
            if (! in_array($gender, ['L', 'P', 'LAKI-LAKI', 'PEREMPUAN'])) {
                $rowErrors[] = "Jenis kelamin [{$gender}] harus 'L' atau 'P'";
            } else {
                $gender = ($gender === 'PEREMPUAN') ? 'P' : 'L';
            }

            if (count($rowErrors) > 0) {
                $errors[] = [
                    'row' => $i,
                    'nisn' => $nisn ?: '-',
                    'name' => $fullName ?: '-',
                    'reason' => implode(', ', $rowErrors),
                ];
            } else {
                $validData[] = [
                    'row' => $i,
                    'nisn' => $nisn,
                    'full_name' => $fullName,
                    'grade' => $grade,
                    'gender' => $gender,
                ];
            }

            // Preview first 5 rows
            if ($i <= 7) {
                $previewRows[] = [
                    'row' => $i,
                    'nisn' => $nisn ?: '-',
                    'name' => $fullName ?: '-',
                    'class' => $grade ?: '-',
                    'gender' => $gender ?: '-',
                    'status' => count($rowErrors) > 0 ? 'ERROR' : 'VALID',
                    'errorMsg' => implode(', ', $rowErrors),
                ];
            }
        }

        return [
            'success' => count($errors) === 0 && $totalDataRows > 0,
            'total_rows' => $totalDataRows,
            'valid_rows' => count($validData),
            'error_rows' => count($errors),
            'errors' => $errors,
            'valid_data' => $validData,
            'preview_rows' => $previewRows,
        ];
    }

    /**
     * Execute the import transaction (FR-01, FR-02).
     */
    public function executeImport(array $validData, ?int $academicYearId = null): array
    {
        $activeYear = $academicYearId
            ? AcademicYear::find($academicYearId)
            : AcademicYear::active()->first();

        if (! $activeYear) {
            return [
                'success' => false,
                'message' => 'Tahun ajaran aktif belum ditentukan.',
            ];
        }

        return DB::transaction(function () use ($validData, $activeYear) {
            // 1. Soft delete / Archive previously active students not in new batch
            $now = Carbon::now();

            // 2. Upsert Students
            $importedCount = 0;
            foreach ($validData as $row) {
                $student = Student::updateOrCreate(
                    ['nisn' => $row['nisn']],
                    [
                        'full_name' => $row['full_name'],
                        'gender' => $row['gender'],
                        'grade' => $row['grade'],
                        'is_archived' => false,
                        'archived_at' => null,
                    ]
                );

                // 3. Link to active academic year pivot
                StudentAcademicYear::firstOrCreate([
                    'student_id' => $student->id,
                    'academic_year_id' => $activeYear->id,
                ]);

                $importedCount++;
            }

            return [
                'success' => true,
                'total_imported' => $importedCount,
                'academic_year' => $activeYear->name,
                'message' => "Berhasil mengimpor {$importedCount} data siswa untuk Tahun Ajaran {$activeYear->name}.",
            ];
        });
    }

    /**
     * Generate sample downloadable .xlsx template for MTsN 3 Kota Padang.
     */
    public function downloadTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Siswa');

        // Set Headers
        $headers = ['NISN', 'NAMA_LENGKAP', 'KELAS', 'JENIS_KELAMIN'];
        $sheet->fromArray([$headers], null, 'A1');

        // Style Headers
        $sheet->getStyle('A1:D1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 11,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1B5E20'], // Brand Primary Green
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        // Add Sample Rows
        $sampleData = [
            ['0078123451', 'Ahmad Fauzi Ridwan', '7.1', 'L'],
            ['0078123452', 'Aisyah Putri Rahmadani', '7.1', 'P'],
            ['0078123453', 'Bintang Pratama', '7.2', 'L'],
            ['0078123454', 'Chairunnisa Azzahra', '8.1', 'P'],
            ['0078123455', 'Daffa Raihan Alfarizi', '9.1', 'L'],
        ];
        $sheet->fromArray($sampleData, null, 'A2');

        // Explicit string format for NISN column (Column A) and KELAS column (Column C)
        for ($r = 2; $r <= 6; $r++) {
            $sheet->getCell("A{$r}")->setValueExplicit($sampleData[$r - 2][0], DataType::TYPE_STRING);
            $sheet->getCell("C{$r}")->setValueExplicit($sampleData[$r - 2][2], DataType::TYPE_STRING);
        }

        // Ensure Column A & C are formatted as text
        $sheet->getStyle('A:A')->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_TEXT);
        $sheet->getStyle('C:C')->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_TEXT);

        // Auto size columns
        foreach (range('A', 'D') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 'template_siswa_mtsn3padang.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
