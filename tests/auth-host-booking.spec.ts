import { test, expect } from '@playwright/test';

test('unauthenticated host routes redirect to login', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/host/add-vehicle');
  await expect(page).toHaveURL(/\/login\?redirect=%2Fhost%2Fadd-vehicle/);

  await page.goto('/host/vehicles');
  await expect(page).toHaveURL(/\/login\?redirect=%2Fhost%2Fvehicles/);
});

test('rego lookup works on add vehicle page after login redirect screen', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/login');
  await page.goto('/host/add-vehicle');
  await expect(page).toHaveURL(/\/login/);

  const loginHeading = page.getByText('Welcome back');
  await expect(loginHeading).toBeVisible();
});

test('unauthenticated booking flow redirects to login after dates are selected', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  await page.goto('/cars/1');
  await page.locator('input[type="date"]').nth(0).fill('2026-04-10');
  await page.locator('input[type="date"]').nth(1).fill('2026-04-12');
  await page.getByRole('button', { name: /Book Now/i }).click();

  await expect(page).toHaveURL(/\/login\?redirect=\/cars\/1/);
});
