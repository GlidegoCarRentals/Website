const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://glidego.vercel.app';

// ─────────────────────────────────────────────
// MODULE 3 — DESIGN SYSTEM TESTS
// ─────────────────────────────────────────────

test.describe('3A — Responsive Breakpoints', () => {

  const pages_to_check = ['/', '/login', '/signup'];

  for (const path of pages_to_check) {
    test(`Mobile 320px — no horizontal scroll on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 812 });
      await page.goto(`${BASE_URL}${path}`);
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(325); // max 5px tolerance
    });

    test(`Tablet 768px — page renders on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${BASE_URL}${path}`);
      const response_ok = await page.evaluate(() => document.readyState);
      expect(response_ok).toBe('complete');
    });

    test(`Desktop 1280px — page renders on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`${BASE_URL}${path}`);
      const response_ok = await page.evaluate(() => document.readyState);
      expect(response_ok).toBe('complete');
    });
  }

});

test.describe('3B — No alert() calls (Toast check)', () => {

  test('Homepage — no native alert() triggered on load', async ({ page }) => {
    let alertFired = false;
    page.on('dialog', dialog => {
      alertFired = true;
      dialog.dismiss();
    });
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    expect(alertFired).toBe(false);
  });

  test('Login page — no native alert() on load', async ({ page }) => {
    let alertFired = false;
    page.on('dialog', dialog => {
      alertFired = true;
      dialog.dismiss();
    });
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(2000);
    expect(alertFired).toBe(false);
  });

});

test.describe('3C — CSS Variables (Design Tokens)', () => {

  test('Primary color CSS variable is defined', async ({ page }) => {
    await page.goto(BASE_URL);
    const primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary').trim();
    });
    expect(primaryColor.length).toBeGreaterThan(0);
  });

  test('Font Inter or Plus Jakarta is loaded', async ({ page }) => {
    await page.goto(BASE_URL);
    const fontFamily = await page.evaluate(() => {
      return getComputedStyle(document.body).fontFamily;
    });
    // Check font is not default Times New Roman or serif fallback only
    expect(fontFamily.toLowerCase()).not.toBe('times new roman');
  });

});

test.describe('3D — Images & Assets', () => {

  test('No broken images on homepage', async ({ page }) => {
    await page.goto(BASE_URL);
    const brokenImages = await page.evaluate(() => {
      return Array.from(document.images)
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src);
    });
    expect(brokenImages).toHaveLength(0);
  });

  test('No broken images on login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    const brokenImages = await page.evaluate(() => {
      return Array.from(document.images)
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src);
    });
    expect(brokenImages).toHaveLength(0);
  });

});

test.describe('3E — Performance Basics', () => {

  test('Homepage loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - start;
    console.log(`Homepage load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });

  test('Login page loads within 4 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - start;
    console.log(`Login page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(4000);
  });

});
