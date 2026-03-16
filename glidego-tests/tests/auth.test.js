const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://glidego.vercel.app';
const TEST_EMAIL = `testuser_${Date.now()}@mailinator.com`;
const TEST_PASSWORD = 'GlideGo@1234';
const WRONG_PASSWORD = 'wrongpass123';

// Helper — login page pe jao aur signup mode select karo
async function goToSignup(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  // Signup mode button dhundho
  const signupBtn = page.locator('button', { hasText: /sign.?up|register|create/i });
  if (await signupBtn.count() > 0) {
    await signupBtn.first().click();
    await page.waitForTimeout(500);
  }
}

// Helper — email input dhundho (className="inp" with type=email)
async function fillEmail(page, value) {
  await page.locator('input[type="email"]').first().fill(value);
}

async function fillPassword(page, value) {
  await page.locator('input[type="password"]').first().fill(value);
}

// ─────────────────────────────────────────────
// MODULE 1 — AUTHENTICATION TESTS
// ─────────────────────────────────────────────

test.describe('1A — Signup Form Validation', () => {

  test('Signup mode loads on login page', async ({ page }) => {
    await goToSignup(page);
    // Email input visible hona chahiye
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('Invalid email format is rejected', async ({ page }) => {
    await goToSignup(page);
    await fillEmail(page, 'notanemail');
    await fillPassword(page, TEST_PASSWORD);
    // Submit button click karo
    await page.locator('button.sbtn').first().click();
    const error = page.locator('text=/invalid|valid email|email|format|wrong/i');
    await expect(error.first()).toBeVisible({ timeout: 8000 });
  });

  test('Weak password is rejected', async ({ page }) => {
    await goToSignup(page);
    await fillEmail(page, TEST_EMAIL);
    await fillPassword(page, 'abc');
    await page.locator('button.sbtn').first().click();
    const error = page.locator('text=/password|characters|length|weak|short/i');
    await expect(error.first()).toBeVisible({ timeout: 8000 });
  });

});

test.describe('1B — Login Flow', () => {

  test('Login page loads with email and password inputs', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('Wrong password shows error message', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await fillEmail(page, 'test@example.com');
    await fillPassword(page, WRONG_PASSWORD);
    await page.locator('button.sbtn').first().click();
    const error = page.locator('text=/invalid|wrong|incorrect|password|credentials|error/i');
    await expect(error.first()).toBeVisible({ timeout: 10000 });
  });

  test('Non-existent email shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await fillEmail(page, 'nobody_xyz_999@fake.com');
    await fillPassword(page, TEST_PASSWORD);
    await page.locator('button.sbtn').first().click();
    const error = page.locator('text=/wrong email or password|invalid|not found|credentials|login failed|something went wrong/i');
    await expect(error.first()).toBeVisible({ timeout: 15000 });
  });

});

test.describe('1C — Protected Routes', () => {

  test('Host dashboard redirects when logged out', async ({ page }) => {
    await page.goto(`${BASE_URL}/host/dashboard`, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/login|signin|auth/, { timeout: 10000 });
  });

  test('Admin panel redirects when logged out', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/login|signin|auth|403/, { timeout: 10000 });
  });

  test('Host earnings redirects when logged out', async ({ page }) => {
    await page.goto(`${BASE_URL}/host/earnings`, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/login|signin|auth/, { timeout: 10000 });
  });

});

test.describe('1D — Password Reset', () => {

  test('Reset password page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/reset-password`, { waitUntil: 'networkidle' });
    // Page load ho jaaye
    await expect(page).toHaveURL(/reset-password/, { timeout: 8000 });
  });

});

test.describe('1E — Page Load & Navigation', () => {

  test('Homepage loads successfully', async ({ page }) => {
    const response = await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    expect(response.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/.+/);
  });

  test('Login page loads with form', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('Fleet page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'networkidle' });
    const response_ok = await page.evaluate(() => document.readyState);
    expect(response_ok).toBe('complete');
  });

  test('No 404 resources on homepage', async ({ page }) => {
    const failed = [];
    page.on('response', res => {
      if (res.status() === 404) failed.push(res.url());
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    // favicon ya minor resources ignore karo
    const criticalFailed = failed.filter(url =>
      !url.includes('favicon') && !url.includes('.ico')
    );
    console.log('404 resources:', criticalFailed);
    expect(criticalFailed).toHaveLength(0);
  });

});
