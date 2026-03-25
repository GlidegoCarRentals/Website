import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('https://your-site.vercel.app');
  await expect(page).toHaveTitle(/./);
});

test('booking flow', async ({ page }) => {
  await page.goto('https://your-site.vercel.app');
  await page.click('text=Book Now');
  await expect(page).toHaveURL(/checkout/);
});