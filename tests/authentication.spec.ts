import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@elhadegel.co.il';
const ADMIN_PASSWORD = 'Tsitsi2025!!';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test logged out
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());
  });

  test('redirects unauthenticated user from landing page to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');

    // Verify login form displays
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('redirects unauthenticated user from admin to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL('/login');
  });

  test('successful login redirects to landing page', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.fill('input[id="email"]', ADMIN_EMAIL);
    await page.fill('input[id="password"]', ADMIN_PASSWORD);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page).toHaveURL('/');

    // Verify PageHeader displays (first header contains user menu)
    await expect(page.locator('header').first()).toBeVisible();

    // Verify protected content visible (buttons exist in PageHeader)
    await expect(page.locator('button:has-text("לוח בקרה")').first()).toBeVisible();
    await expect(page.locator('button:has-text("התנתק")').first()).toBeVisible();
  });

  test('failed login shows error message', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[id="email"]', 'wrong@email.com');
    await page.fill('input[id="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait a moment for error to appear
    await page.waitForTimeout(2000);

    // Should stay on login page
    await expect(page).toHaveURL('/login');

    // Error message should display (Hebrew text)
    await expect(page.locator('text=אימייל או סיסמה שגויים')).toBeVisible();
  });

  test('authenticated user can navigate to admin', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[id="email"]', ADMIN_EMAIL);
    await page.fill('input[id="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });

    // Wait for the button to be visible
    await page.locator('button:has-text("לוח בקרה")').first().waitFor({ state: 'visible' });

    // Navigate to admin - find the button more precisely
    await page.locator('button:has-text("לוח בקרה")').first().click();
    await page.waitForURL('/admin', { timeout: 15000 });
    await expect(page).toHaveURL('/admin');

    // Verify admin content visible
    await expect(page.locator('header').first()).toBeVisible();
  });

  test('authenticated user can navigate from admin to home', async ({ page }) => {
    // Login and go to admin
    await page.goto('/login');
    await page.fill('input[id="email"]', ADMIN_EMAIL);
    await page.fill('input[id="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });

    // Wait for button and go to admin
    await page.locator('button:has-text("לוח בקרה")').first().waitFor({ state: 'visible' });
    await page.locator('button:has-text("לוח בקרה")').first().click();
    await page.waitForURL('/admin', { timeout: 15000 });

    // Navigate back to home
    await page.locator('button:has-text("עמוד הבית")').first().waitFor({ state: 'visible' });
    await page.locator('button:has-text("עמוד הבית")').first().click();
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page).toHaveURL('/');
  });

  test('logout from landing page destroys session', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[id="email"]', ADMIN_EMAIL);
    await page.fill('input[id="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });

    // Logout
    await page.click('text=התנתק');
    await page.waitForURL('/login', { timeout: 10000 });
    await expect(page).toHaveURL('/login');

    // Try to access protected route
    await page.goto('/');
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });

  test('logout from admin page destroys session', async ({ page }) => {
    // Login and navigate to admin
    await page.goto('/login');
    await page.fill('input[id="email"]', ADMIN_EMAIL);
    await page.fill('input[id="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });

    // Go to admin
    await page.locator('button:has-text("לוח בקרה")').first().waitFor({ state: 'visible' });
    await page.locator('button:has-text("לוח בקרה")').first().click();
    await page.waitForURL('/admin', { timeout: 15000 });

    // Logout (use first button since there may be duplicates)
    await page.locator('button:has-text("התנתק")').first().waitFor({ state: 'visible' });
    await page.locator('button:has-text("התנתק")').first().click();
    await page.waitForURL('/login', { timeout: 10000 });
    await expect(page).toHaveURL('/login');

    // Try to access admin
    await page.goto('/admin');
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });

  test('session persists across page refreshes', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[id="email"]', ADMIN_EMAIL);
    await page.fill('input[id="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });

    // Refresh page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Should still be logged in
    await expect(page).toHaveURL('/');
    await expect(page.locator('header').first()).toBeVisible();
  });
});

test.describe('UI Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login for UI tests
    await page.goto('/login');
    await page.fill('input[id="email"]', ADMIN_EMAIL);
    await page.fill('input[id="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('PageHeader displays correctly', async ({ page }) => {
    // Verify header elements (use first() since there are multiple headers)
    await expect(page.locator('header').first()).toBeVisible();
    await expect(page.locator('button:has-text("לוח בקרה")').first()).toBeVisible();
    await expect(page.locator('button:has-text("התנתק")').first()).toBeVisible();
  });

  test('AdminHeader displays correctly', async ({ page }) => {
    // Wait for button and navigate to admin
    await page.locator('button:has-text("לוח בקרה")').first().waitFor({ state: 'visible' });
    await page.locator('button:has-text("לוח בקרה")').first().click();
    await page.waitForURL('/admin', { timeout: 15000 });

    // Verify admin header elements (use first() since there are multiple headers/buttons)
    await expect(page.locator('header').first()).toBeVisible();
    await expect(page.locator('button:has-text("עמוד הבית")').first()).toBeVisible();
    await expect(page.locator('button:has-text("התנתק")').first()).toBeVisible();
  });
});
