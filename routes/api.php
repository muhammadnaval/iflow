<?php

use App\Http\Controllers\Admin\StudentImportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ScanController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // 3.3 Presensi Scan QR (FR-04, FR-05, FR-06, FR-09)
    Route::post('/presence/scan', [ScanController::class, 'store']);

    // 3.4 Dashboard Realtime Initial Data (FR-07)
    Route::get('/presence/dashboard', [DashboardController::class, 'index']);

    // 3.5 Laporan Bulanan Siswa (FR-08)
    Route::get('/reports/monthly-student', [ReportController::class, 'monthly']);

    // 3.2 Import Data Siswa (FR-01, FR-02)
    Route::post('/admin/students/import', [StudentImportController::class, 'store']);
});
