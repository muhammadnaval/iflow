<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UserImportService
{
    /**
     * Parse and validate an uploaded user Excel file.
     *
     * @param  UploadedFile|string  $file
     */
    public function parseAndValidate($file): array
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
                'errors' => [['row' => 1, 'name' => '-', 'email' => '-', 'reason' => 'Berkas Excel kosong atau tidak memiliki baris data.']],
                'preview_rows' => [],
            ];
        }

        // Validate Header (Row 1)
        $colA = strtoupper(trim((string) ($rows[1]['A'] ?? '')));
        $colB = strtoupper(trim((string) ($rows[1]['B'] ?? '')));
        $colC = strtoupper(trim((string) ($rows[1]['C'] ?? '')));
        $colD = strtoupper(trim((string) ($rows[1]['D'] ?? '')));

        if (! str_contains($colA, 'NAMA') || ! str_contains($colB, 'EMAIL') || ! str_contains($colC, 'ROLE') || ! str_contains($colD, 'PASSWORD')) {
            return [
                'success' => false,
                'total_rows' => 0,
                'valid_rows' => 0,
                'error_rows' => 1,
                'errors' => [['row' => 1, 'name' => '-', 'email' => '-', 'reason' => 'Header kolom tidak sesuai template resmi. Wajib: NAMA, EMAIL, ROLE, PASSWORD.']],
                'preview_rows' => [],
            ];
        }

        $validData = [];
        $errors = [];
        $seenEmails = [];
        $previewRows = [];
        $totalDataRows = 0;

        for ($i = 2; $i <= count($rows); $i++) {
            $row = $rows[$i] ?? [];
            $name = trim((string) ($row['A'] ?? ''));
            $email = strtolower(trim((string) ($row['B'] ?? '')));
            $role = strtoupper(trim((string) ($row['C'] ?? '')));
            $password = trim((string) ($row['D'] ?? ''));

            // Skip completely blank rows
            if ($name === '' && $email === '' && $role === '' && $password === '') {
                continue;
            }

            $totalDataRows++;
            $rowErrors = [];

            // 1. Name validation
            if ($name === '' || mb_strlen($name) < 3) {
                $rowErrors[] = 'Nama lengkap wajib diisi minimal 3 karakter';
            }

            // 2. Email validation
            if ($email === '') {
                $rowErrors[] = 'Email tidak boleh kosong';
            } elseif (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $rowErrors[] = "Format email [{$email}] tidak valid";
            } elseif (isset($seenEmails[$email])) {
                $rowErrors[] = "Email [{$email}] duplikat dengan baris {$seenEmails[$email]} di berkas yang sama";
            } else {
                $seenEmails[$email] = $i;
            }

            // 3. Role validation (ADMIN, PETUGAS, KEPALA)
            $allowedRoles = ['ADMIN', 'PETUGAS', 'KEPALA'];
            if (! in_array($role, $allowedRoles, true)) {
                $rowErrors[] = "Role [{$role}] tidak valid (Pilihan: ADMIN, PETUGAS, KEPALA)";
            }

            // 4. Password validation (required, min 8 chars)
            if ($password === '') {
                $rowErrors[] = 'Password wajib diisi (tidak boleh kosong)';
            } elseif (strlen($password) < 8) {
                $rowErrors[] = 'Password minimal 8 karakter';
            }

            // 5. Optional Assigned Classes (Column E)
            $rawClasses = trim((string) ($row['E'] ?? ''));
            $assignedClasses = null;
            if ($rawClasses !== '' && strtoupper($rawClasses) !== 'ALL' && strtoupper($rawClasses) !== 'SEMUA') {
                $assignedClasses = array_values(array_filter(array_map('trim', preg_split('/[,;]+/', $rawClasses))));
            }

            if (count($rowErrors) > 0) {
                $errors[] = [
                    'row' => $i,
                    'name' => $name ?: '-',
                    'email' => $email ?: '-',
                    'role' => $role ?: '-',
                    'assigned_classes' => $assignedClasses,
                    'reason' => implode(', ', $rowErrors),
                ];
            } else {
                $validData[] = [
                    'row' => $i,
                    'name' => $name,
                    'email' => $email,
                    'role' => $role,
                    'password' => $password,
                    'assigned_classes' => $assignedClasses,
                ];
            }

            // Preview rows for UI modal
            if ($i <= 10) {
                $previewRows[] = [
                    'row' => $i,
                    'name' => $name ?: '-',
                    'email' => $email ?: '-',
                    'role' => $role ?: '-',
                    'assigned_classes' => $assignedClasses ? implode(', ', $assignedClasses) : 'Semua Kelas',
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
     * Execute the import transaction with Upsert support.
     */
    public function executeImport(array $validData): array
    {
        return DB::transaction(function () use ($validData) {
            $createdCount = 0;
            $updatedCount = 0;

            foreach ($validData as $row) {
                $existingUser = User::where('email', $row['email'])->first();

                $userData = [
                    'name' => $row['name'],
                    'role' => $row['role'],
                    'password' => Hash::make($row['password']),
                    'is_active' => true,
                ];

                if (array_key_exists('assigned_classes', $row)) {
                    $userData['assigned_classes'] = $row['assigned_classes'];
                }

                if ($existingUser) {
                    $existingUser->update($userData);
                    $updatedCount++;
                } else {
                    $userData['email'] = $row['email'];
                    User::create($userData);
                    $createdCount++;
                }
            }

            $total = $createdCount + $updatedCount;

            return [
                'success' => true,
                'total_processed' => $total,
                'created_count' => $createdCount,
                'updated_count' => $updatedCount,
                'message' => "Berhasil memproses {$total} akun pengguna ({$createdCount} akun baru ditambahkan, {$updatedCount} akun diperbarui).",
            ];
        });
    }

    /**
     * Generate sample downloadable .xlsx template for users/officers.
     */
    public function downloadTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Pengguna');

        // Set Headers
        $headers = ['NAMA', 'EMAIL', 'ROLE', 'PASSWORD', 'KELAS'];
        $sheet->fromArray([$headers], null, 'A1');

        // Style Headers
        $sheet->getStyle('A1:E1')->applyFromArray([
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
            ['Ustadz Hendri, S.Pd.I', 'petugas.hendri@mtsn3padang.sch.id', 'PETUGAS', 'password123', 'VII-A, VII-B'],
            ['Ustadzah Nurul, S.Ag', 'petugas.nurul@mtsn3padang.sch.id', 'PETUGAS', 'password123', 'VIII-A, VIII-B'],
            ['H. Syamsul Bahri, M.Pd', 'kepala.syamsul@mtsn3padang.sch.id', 'KEPALA', 'password123', 'ALL'],
            ['Admin IT Madrasah', 'admin.it@mtsn3padang.sch.id', 'ADMIN', 'password123', 'ALL'],
        ];
        $sheet->fromArray($sampleData, null, 'A2');

        // Auto size columns
        foreach (range('A', 'E') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 'template_pengguna_mtsn3padang.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
