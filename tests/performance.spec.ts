import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@elhadegel.co.il';
const ADMIN_PASSWORD = 'Tsitsi2025!!';

test.describe('Performance Tests', () => {
  test('landing page load time after auth', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[id="email"]', ADMIN_EMAIL);
    await page.fill('input[id="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });

    // Measure landing page load
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const endTime = Date.now();

    const loadTime = endTime - startTime;
    console.log(`Landing page load time: ${loadTime}ms`);

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('admin page load time', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[id="email"]', ADMIN_EMAIL);
    await page.fill('input[id="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });

    // Measure admin page load
    const startTime = Date.now();
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    const endTime = Date.now();

    const loadTime = endTime - startTime;
    console.log(`Admin page load time: ${loadTime}ms`);

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('login redirect time', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="email"]', ADMIN_EMAIL);
    await page.fill('input[id="password"]', ADMIN_PASSWORD);

    const startTime = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    const endTime = Date.now();

    const redirectTime = endTime - startTime;
    console.log(`Login redirect time: ${redirectTime}ms`);

    // Should redirect within 2 seconds
    expect(redirectTime).toBeLessThan(2000);
  });

  test('session check overhead on page refresh', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[id="email"]', ADMIN_EMAIL);
    await page.fill('input[id="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });

    // Measure refresh time
    const startTime = Date.now();
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    const endTime = Date.now();

    const refreshTime = endTime - startTime;
    console.log(`Page refresh time with session check: ${refreshTime}ms`);

    // Should be reasonably fast
    expect(refreshTime).toBeLessThan(3000);
  });
});
