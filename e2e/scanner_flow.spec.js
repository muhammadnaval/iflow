import { test, expect } from '@playwright/test';

test.describe('Mobile QR Scanner Flow', () => {
  test('Scanner view and manual lookup / test scan flow', async ({ page }) => {
    // 0. Login before accessing protected /scan route
    await page.goto('/login');
    await page.fill('input#email', 'admin@mtsn3padang.sch.id');
    await page.fill('input#password', 'AdminMTsN3Padang2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // 1. Visit Scanner Page
    await page.goto('/scan');
    await expect(page).toHaveTitle(/Scan Presensi QR/);

    // 2. Check UI elements
    await expect(page.getByText('MTsN 3 Kota Padang', { exact: true })).toBeVisible();
    await expect(page.getByText('Petugas:')).toBeVisible();
    await expect(page.locator('span:has-text("Tugas:")').or(page.locator('span:has-text("Semua Kelas")')).first()).toBeVisible();

    // 3. Test Manual Lookup Modal
    const manualBtn = page.getByRole('button', { name: /Cari Manual via NISN/i });
    await expect(manualBtn).toBeVisible();
    await manualBtn.click();

    // Verify modal is open
    await expect(page.getByRole('heading', { name: /Pencarian Presensi Manual/i })).toBeVisible();

    // Search by NISN
    const searchInput = page.locator('input[placeholder*="0078123401"]');
    await searchInput.fill('0078123401');
    await page.getByRole('button', { name: 'Cari', exact: true }).click();

    // Confirm student found
    await expect(page.getByText(/Konfirmasi Presensi Siswa Ini/i)).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: '✕' }).click();

    // 4. Test Quick Scan Button with seeded student
    const testScanBtn = page.locator('button:has-text("Farhan")').first();
    if (await testScanBtn.isVisible()) {
      await testScanBtn.click();
      await page.waitForTimeout(500);

      // Verify status banner or duplicate warning pops up
      const feedbackBanner = page.locator('[role="status"]');
      await expect(feedbackBanner).toBeVisible();
    }
  });
});
