<?php

use App\Http\Controllers\Admin\AcademicYearController;
use App\Http\Controllers\Admin\QrCardController;
use App\Http\Controllers\Admin\StudentImportController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ScanController;
use App\Models\AcademicYear;
use Inertia\Inertia;

// Landing Page (Welcome)
Route::get('/', function () {
    try {
        $activeYear = AcademicYear::active()->first();
    } catch (Throwable) {
        $activeYear = null;
    }

    return Inertia::render('Welcome', [
        'activeYear' => $activeYear?->name ?? '2025/2026',
        'presenceWindow' => [
            'start_time' => $activeYear?->presence_start_time ? substr($activeYear->presence_start_time, 0, 5) : '11:45',
            'end_time' => $activeYear?->presence_end_time ? substr($activeYear->presence_end_time, 0, 5) : '12:30',
            'tolerance' => $activeYear?->late_tolerance_minutes ?? 15,
        ],
    ]);
})->name('welcome');

// Internal Application Routes (Protected by Auth)
Route::middleware('auth')->group(function () {
    // Dashboard Realtime (FR-07)
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::put('/attendance/{attendanceLog}', [DashboardController::class, 'updateAttendance'])->name('attendance.update');
    Route::delete('/attendance/{attendanceLog}', [DashboardController::class, 'destroyAttendance'])->name('attendance.destroy');

    // Presensi Scan QR (FR-04, FR-05, FR-06, FR-09)
    Route::get('/scan', [ScanController::class, 'index'])->name('scan.index');
    Route::post('/scan', [ScanController::class, 'store'])->name('scan.store');

    // Modul Admin: Import Data Siswa & Arsip (FR-01, FR-02)
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/students/import', [StudentImportController::class, 'index'])->name('students.import');
        Route::post('/students/import/validate', [StudentImportController::class, 'validateFile'])->name('students.import.validate');
        Route::post('/students/import/store', [StudentImportController::class, 'store'])->name('students.import.store');
        Route::get('/students/import/template', [StudentImportController::class, 'downloadTemplate'])->name('students.import.template');

        Route::get('/students/qr-cards', [QrCardController::class, 'index'])->name('students.qr-cards');

        Route::get('/academic-years', [AcademicYearController::class, 'index'])->name('academic-years.index');
        Route::post('/academic-years', [AcademicYearController::class, 'store'])->name('academic-years.store');
        Route::post('/academic-years/{academicYear}/activate', [AcademicYearController::class, 'activate'])->name('academic-years.activate');
        Route::post('/academic-years/{academicYear}/time-window', [AcademicYearController::class, 'updateTimeWindow'])->name('academic-years.time-window');

        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::post('/users/{user}/toggle', [UserController::class, 'toggleStatus'])->name('users.toggle');
        Route::post('/users/import/validate', [UserController::class, 'validateImport'])->name('users.import.validate');
        Route::post('/users/import/store', [UserController::class, 'storeImport'])->name('users.import.store');
        Route::get('/users/import/template', [UserController::class, 'downloadTemplate'])->name('users.import.template');
    });

    // Laporan Bulanan (FR-08)
    Route::get('/reports/monthly', [ReportController::class, 'monthly'])->name('reports.monthly');
    Route::get('/reports/monthly/export-excel', [ReportController::class, 'exportExcel'])->name('reports.monthly.export');
    Route::get('/reports/monthly/officers/export-excel', [ReportController::class, 'exportOfficerExcel'])->name('reports.monthly.officers.export');

    // Profil Pengguna
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
