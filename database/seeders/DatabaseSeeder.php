<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\AttendanceLog;
use App\Models\Student;
use App\Models\StudentAcademicYear;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Default Users
        $admin = User::firstOrCreate(
            ['email' => 'admin@mtsn3padang.sch.id'],
            [
                'name' => 'Administrator Madrasah',
                'password' => Hash::make('password'),
                'role' => 'ADMIN',
                'is_active' => true,
            ]
        );

        $petugas1 = User::firstOrCreate(
            ['email' => 'petugas1@mtsn3padang.sch.id'],
            [
                'name' => 'Ustadz Zulham, S.Pd.I',
                'password' => Hash::make('password'),
                'role' => 'PETUGAS',
                'assigned_classes' => ['VII-A', 'VII-B', 'VII-C'],
                'is_active' => true,
            ]
        );

        $petugas2 = User::firstOrCreate(
            ['email' => 'petugas2@mtsn3padang.sch.id'],
            [
                'name' => 'Ustadzah Rahma, S.Pd',
                'password' => Hash::make('password'),
                'role' => 'PETUGAS',
                'assigned_classes' => ['VIII-A', 'VIII-B', 'VIII-C'],
                'is_active' => true,
            ]
        );

        $kepala = User::firstOrCreate(
            ['email' => 'kepala@mtsn3padang.sch.id'],
            [
                'name' => 'Drs. H. Nur Alim, M.Pd',
                'password' => Hash::make('password'),
                'role' => 'KEPALA',
                'is_active' => true,
            ]
        );

        // 2. Seed Academic Years
        $activeYear = AcademicYear::firstOrCreate(
            ['name' => '2025/2026'],
            [
                'start_date' => '2025-07-15',
                'end_date' => '2026-06-20',
                'is_active' => true,
                'presence_start_time' => '11:45:00',
                'presence_end_time' => '12:30:00',
                'late_tolerance_minutes' => 15,
            ]
        );

        $archivedYear = AcademicYear::firstOrCreate(
            ['name' => '2024/2025'],
            [
                'start_date' => '2024-07-15',
                'end_date' => '2025-06-20',
                'is_active' => false,
                'presence_start_time' => '11:45:00',
                'presence_end_time' => '12:30:00',
                'late_tolerance_minutes' => 15,
            ]
        );

        // 3. Seed 60 Representative Students across classes VII, VIII, IX
        $classes = ['VII-A', 'VII-B', 'VII-C', 'VIII-A', 'VIII-B', 'VIII-C', 'IX-A', 'IX-B', 'IX-C'];
        $firstNamesL = ['Ahmad', 'Bintang', 'Daffa', 'Fadhil', 'Hafiz', 'Jefri', 'Lukmanul', 'Muhammad', 'Omar', 'Qori', 'Rahmat', 'Thoriq', 'Zikri', 'Farhan', 'Rizky', 'Ihsan', 'Syamil', 'Fauzan'];
        $firstNamesP = ['Aisyah', 'Chairunnisa', 'Ghaida', 'Indah', 'Khadijah', 'Nadia', 'Putri', 'Siti', 'Zahra', 'Salma', 'Fitri', 'Hanifa', 'Nabila', 'Rania', 'Tasya', 'Humaira'];
        $lastNames = ['Pratama', 'Ridwan', 'Rahmadani', 'Azzahra', 'Alfarizi', 'Hakim', 'Permata Sari', 'Nurul Huda', 'Safitri', 'Maharani', 'Al-Baqir', 'Hidayatullah', 'Maryam', 'Ziyad', 'Ramadhan', 'Fauzi'];

        $createdStudents = [];
        $nisnCounter = 78123401;

        foreach ($classes as $cIdx => $className) {
            for ($s = 1; $s <= 6; $s++) {
                $isMale = ($s % 2 === 1);
                $fName = $isMale ? $firstNamesL[array_rand($firstNamesL)] : $firstNamesP[array_rand($firstNamesP)];
                $lName = $lastNames[array_rand($lastNames)];
                $fullName = "{$fName} {$lName}";
                $nisn = sprintf('00%08d', $nisnCounter++);

                $student = Student::updateOrCreate(
                    ['nisn' => $nisn],
                    [
                        'full_name' => $fullName,
                        'gender' => $isMale ? 'L' : 'P',
                        'grade' => $className,
                        'is_archived' => false,
                    ]
                );

                StudentAcademicYear::firstOrCreate([
                    'student_id' => $student->id,
                    'academic_year_id' => $activeYear->id,
                ]);

                $createdStudents[] = $student;
            }
        }

        // 4. Seed Attendance Logs for Today & Past School Days
        $today = Carbon::today();
        $scannedOfficers = [$petugas1->id, $petugas2->id];

        // Seed logs for today (40 students)
        foreach (array_slice($createdStudents, 0, 42) as $idx => $student) {
            $isLate = ($idx >= 36);
            $scannedTime = $isLate ? '12:08:24' : sprintf('11:%02d:%02d', rand(47, 58), rand(10, 55));
            $status = $isLate ? 'TERLAMBAT' : 'HADIR';
            $rejectReason = $isLate ? 'Scan melebihi batas toleransi 15 menit (12:00 WIB)' : null;

            AttendanceLog::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'academic_year_id' => $activeYear->id,
                    'attendance_date' => $today->format('Y-m-d'),
                ],
                [
                    'scanned_by_user_id' => $scannedOfficers[array_rand($scannedOfficers)],
                    'scanned_at' => $scannedTime,
                    'status' => $status,
                    'reject_reason' => $rejectReason,
                ]
            );
        }

        // Seed historical logs for previous 3 weekdays
        for ($dayOffset = 1; $dayOffset <= 3; $dayOffset++) {
            $pastDate = (clone $today)->subWeekdays($dayOffset);
            foreach (array_slice($createdStudents, 0, 48) as $idx => $student) {
                if (rand(1, 10) > 1) { // 90% attendance
                    $isLate = ($idx >= 44);
                    $scannedTime = $isLate ? '12:05:12' : sprintf('11:%02d:%02d', rand(46, 59), rand(10, 55));

                    AttendanceLog::updateOrCreate(
                        [
                            'student_id' => $student->id,
                            'academic_year_id' => $activeYear->id,
                            'attendance_date' => $pastDate->format('Y-m-d'),
                        ],
                        [
                            'scanned_by_user_id' => $scannedOfficers[array_rand($scannedOfficers)],
                            'scanned_at' => $scannedTime,
                            'status' => $isLate ? 'TERLAMBAT' : 'HADIR',
                            'reject_reason' => $isLate ? 'Terlambat' : null,
                        ]
                    );
                }
            }
        }
    }
}
