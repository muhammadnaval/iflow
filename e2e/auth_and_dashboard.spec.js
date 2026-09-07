import { test, expect } from '@playwright/test';

test.describe('Authentication & Dashboard Realtime Flow', () => {
  test('Landing page rendering and navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/I-FLOW/);
    await expect(page.getByRole('heading', { name: /Kedisiplinan Ibadah Siswa/i })).toBeVisible();
    await expect(page.getByText(/Empat Pilar Presensi Terpadu I-FLOW/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Buka Dashboard|Masuk/i }).first()).toBeVisible();
  });

  test('Official Login and Dashboard rendering', async ({ page }) => {
    // 1. Visit Login Page
    await page.goto('/login');
    await expect(page).toHaveTitle(/Masuk - I-FLOW/);
    await expect(page.getByText('MTsN 3 Kota Padang', { exact: true })).toBeVisible();

    // 2. Fill Official Admin Credentials
    await page.fill('input#email', 'admin@mtsn3padang.sch.id');
    await page.fill('input#password', 'AdminMTsN3Padang2026!');
    await page.click('button[type="submit"]');

    // 3. Verify redirected to Dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole('heading', { name: /Dashboard Presensi/i })).toBeVisible();

    // 4. Verify 4 KPI Cards
    await expect(page.getByText('Total Siswa Aktif')).toBeVisible();
    await expect(page.locator('p:has-text("Hadir Tepat Waktu")').first()).toBeVisible();
    await expect(page.locator('p:has-text("Terlambat")').first()).toBeVisible();
    await expect(page.locator('p:has-text("Belum Hadir / Alpha")').first()).toBeVisible();

    // 5. Verify Master-Detail Scans Table has data
    await expect(page.getByText(/Presensi Terbaru Hari Ini/i)).toBeVisible();
    const rows = page.locator('table tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);

    // 6. Test Class & Officer Filters
    const classSelect = page.locator('select[aria-label="Filter Kelas"]');
    await expect(classSelect).toBeVisible();
    await classSelect.selectOption('VII-A');
    await page.waitForTimeout(300);
    await classSelect.selectOption('ALL');

    const officerSelect = page.locator('select[aria-label="Filter Petugas"]');
    await expect(officerSelect).toBeVisible();

    // 7. Verify Pagination Controls & Per-Page selector
    const perPageSelect = page.locator('select[aria-label="Jumlah per halaman"]');
    if (await perPageSelect.isVisible()) {
      await expect(page.getByText(/Menampilkan/i)).toBeVisible();
      await perPageSelect.selectOption('25');
      await page.waitForTimeout(200);
      await perPageSelect.selectOption('10');
    }

    // 8. Test Correction Button & Modal
    const koreksiBtn = page.getByRole('button', { name: /Koreksi/i }).first();
    if (await koreksiBtn.isVisible()) {
      await koreksiBtn.click();
      await expect(page.getByRole('heading', { name: /Detail & Koreksi Presensi/i })).toBeVisible();
      await page.getByRole('button', { name: 'Tutup' }).click();
    }
  });
});
