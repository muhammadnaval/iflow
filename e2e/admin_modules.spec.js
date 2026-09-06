import { test, expect } from '@playwright/test';

test.describe('Admin Modules & Reporting Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin using official credentials
    await page.goto('/login');
    await page.fill('input#email', 'admin@mtsn3padang.sch.id');
    await page.fill('input#password', 'AdminMTsN3Padang2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Student Import Wizard & Template Download', async ({ page }) => {
    await page.goto('/admin/students/import');
    await expect(page.getByRole('heading', { name: /Import Data Siswa Massal/i })).toBeVisible();

    // Check wizard steps
    await expect(page.getByText('Unggah Berkas')).toBeVisible();
    await expect(page.getByText('Validasi Data')).toBeVisible();
    await expect(page.getByText('Arsip & Konfirmasi')).toBeVisible();

    // Check template download button
    const downloadBtn = page.getByRole('button', { name: /Unduh Template .xlsx/i });
    await expect(downloadBtn).toBeVisible();
  });

  test('QR Cards Generation & Print View', async ({ page }) => {
    await page.goto('/admin/students/qr-cards');
    await expect(page.getByRole('heading', { name: /Generate & Cetak Kartu QR Siswa/i })).toBeVisible();

    // Check Print button
    const printBtn = page.getByRole('button', { name: /Cetak.*Kartu Terpilih/i });
    await expect(printBtn).toBeVisible();

    // Check cards
    const cards = page.locator('.qr-card-item');
    expect(await cards.count()).toBeGreaterThan(0);

    // Verify student info inside card
    await expect(page.getByText(/MTsN 3 Kota Padang/i).first()).toBeVisible();

    // Verify QR Code image is generated
    await expect(page.locator('img[alt*="QR Code"]').first()).toBeVisible();
  });

  test('Academic Years & Time Window Configuration', async ({ page }) => {
    await page.goto('/admin/academic-years');
    await expect(page.getByRole('heading', { name: /Tahun Ajaran & Jam Presensi/i })).toBeVisible();

    // Verify time inputs
    const startTimeInput = page.locator('input[type="time"]').first();
    await expect(startTimeInput).toBeVisible();

    // Verify list of academic years
    await expect(page.getByText(/Tahun Ajaran 2025\/2026/i)).toBeVisible();
  });

  test('Monthly Attendance Report Matrix & Excel Export', async ({ page }) => {
    await page.goto('/reports/monthly');
    await expect(page.getByRole('heading', { name: /Laporan Rekapitulasi Presensi Bulanan/i })).toBeVisible();

    // Verify summary statistics
    await expect(page.getByText('Hari Efektif Sekolah')).toBeVisible();
    await expect(page.getByText('Total Siswa Terdaftar')).toBeVisible();

    // Verify export buttons
    await expect(page.getByRole('button', { name: /Ekspor Excel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cetak Laporan/i })).toBeVisible();

    // Verify table records
    const rows = page.locator('table tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('User & Officer Management and Excel Import Modal', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: /Manajemen Pengguna & Petugas Piket/i })).toBeVisible();

    // Verify user list
    await expect(page.getByText('admin@mtsn3padang.sch.id')).toBeVisible();
    await expect(page.getByText('petugas1@mtsn3padang.sch.id')).toBeVisible();

    // Test open add user modal
    await page.getByRole('button', { name: /Tambah Akun/i }).click();
    await expect(page.getByRole('heading', { name: /Tambah Akun Pengguna Baru/i })).toBeVisible();
    await page.getByRole('button', { name: 'Batal' }).click();

    // Test open Import Excel modal
    await page.getByRole('button', { name: /Import Excel/i }).click();
    await expect(page.getByText(/Import Akun Pengguna & Petugas dari Excel/i)).toBeVisible();
    await expect(page.getByText(/Gunakan Template Resmi MTsN 3 Kota Padang/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Unduh Template/i })).toBeVisible();
    await page.getByRole('button', { name: 'Batal' }).click();

    // Test open Edit User modal
    const editBtn = page.getByRole('button', { name: /Edit/i }).first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    await expect(page.getByRole('heading', { name: /Edit Data Pengguna & Petugas/i })).toBeVisible();
    await page.getByRole('button', { name: 'Batal' }).click();
  });
});
