const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://glidego.vercel.app';
const TEST_EMAIL = `testuser_${Date.now()}@mailinator.com`;
const TEST_PASSWORD = 'GlideGo@1234';
const WRONG_PASSWORD = 'wrongpass';

// ─────────────────────────────────────────────
// MODULE 1 — AUTHENTICATION TESTS
// ─────────────────────────────────────────────

test.describe('1A — Signup Form Validation', () => {

  test('Empty form shows validation errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    await page.click('button[type="submit"]');

    // At least one error message should appear
    const errors = page.locator('text=/required|enter|invalid|field/i');
    await expect(errors.first()).toBeVisible({ timeout: 5000 });
  });

  test('Invalid email format is rejected', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[type="email"], input[name="email"]', 'notanemail');
    await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    const error = page.locator('text=/invalid email|valid email|email format/i');
    await expect(error.first()).toBeVisible({ timeout: 5000 });
  });

  test('Weak password (under 8 chars) is rejected', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', 'abc');
    await page.click('button[type="submit"]');

    const error = page.locator('text=/password|characters|length|weak/i');
    await expect(error.first()).toBeVisible({ timeout: 5000 });
  });

});

test.describe('1B — Login Flow', () => {

  test('Wrong password shows error message', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', 'existing@example.com');
    await page.fill('input[type="password"], input[name="password"]', WRONG_PASSWORD);
    await page.click('button[type="submit"]');

    const error = page.locator('text=/invalid|wrong|incorrect|password|credentials/i');
    await expect(error.first()).toBeVisible({ timeout: 8000 });
  });

  test('Non-existent email shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', 'nobody_xyz_123@fake.com');
    await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    const error = page.locator('text=/invalid|not found|no account|credentials/i');
    await expect(error.first()).toBeVisible({ timeout: 8000 });
  });

});

test.describe('1C — Protected Routes', () => {

  test('Dashboard redirects to login when logged out', async ({ page }) => {
    // Fresh browser = logged out
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/login|signin|auth/, { timeout: 8000 });
  });

  test('Host dashboard redirects when logged out', async ({ page }) => {
    await page.goto(`${BASE_URL}/host/dashboard`);
    await expect(page).toHaveURL(/login|signin|auth/, { timeout: 8000 });
  });

  test('Admin panel redirects when logged out', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await expect(page).toHaveURL(/login|signin|auth|403|forbidden/, { timeout: 8000 });
  });

  test('Bookings page redirects when logged out', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings`);
    await expect(page).toHaveURL(/login|signin|auth/, { timeout: 8000 });
  });

});

test.describe('1D — Password Reset', () => {

  test('Forgot password page loads and accepts email', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`);
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    // Should show confirmation message
    const confirm = page.locator('text=/email sent|check your|reset link|sent/i');
    await expect(confirm.first()).toBeVisible({ timeout: 8000 });
  });

});

test.describe('1E — Page Load & Navigation', () => {

  test('Homepage loads successfully', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/.+/); // Title exists
  });

  test('Login page loads with form', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test('Signup page loads with form', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test('No console errors on homepage', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

});
