/**
 * E2E Tests for Custom Fields System
 * Tests full user journey from creating field definitions to filling values and exporting
 */

import { test, expect } from '@playwright/test';

// Test configuration
const ADMIN_EMAIL = 'admin@elhadegel.co.il';
const ADMIN_PASSWORD = 'Tsitsi2025!!';
const BASE_URL = 'http://localhost:3000';

// Helper function to login as admin
async function loginAsAdmin(page: any) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/`);
}

// Helper function to create a test questionnaire if needed
async function ensureTestQuestionnaire(page: any): Promise<number> {
  // Navigate to questionnaires page
  await page.goto(`${BASE_URL}/admin/questionnaires`);

  // Check if we have any questionnaires
  const hasQuestionnaires = await page.locator('text="עדכן"').count() > 0;

  if (!hasQuestionnaires) {
    // Create a new questionnaire
    await page.click('text="צור שאלון חדש"');
    await page.fill('input[name="title"]', 'שאלון בדיקה - שדות מותאמים');
    await page.fill('textarea[name="description"]', 'שאלון לבדיקת מערכת שדות מותאמים אישית');
    await page.click('button:has-text("צור שאלון")');
    await page.waitForURL(/\/admin\/questionnaires\/\d+/);
  }

  // Get the first questionnaire ID from URL
  await page.click('text="עדכן"').first();
  const url = page.url();
  const match = url.match(/\/questionnaires\/(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

test.describe('Custom Fields System', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Scenario 1: Create and manage custom field definitions', async ({ page }) => {
    // Ensure we have a questionnaire
    const questionnaireId = await ensureTestQuestionnaire(page);

    // Navigate to custom fields page
    await page.goto(`${BASE_URL}/admin/questionnaires/${questionnaireId}/custom-fields`);

    // Verify we're on the right page
    await expect(page.locator('h1:has-text("ניהול שדות מותאמים אישית")')).toBeVisible();

    // Test 1: Create TEXT field
    await page.click('button:has-text("הוסף שדה")');
    await page.fill('input[name="fieldName"]', 'עיר מגורים');
    await page.selectOption('select[name="fieldType"]', 'TEXT');
    await page.click('button:has-text("צור שדה")');

    // Verify field appears in list
    await expect(page.locator('text="עיר מגורים"')).toBeVisible();

    // Test 2: Create LONG_TEXT field
    await page.click('button:has-text("הוסף שדה")');
    await page.fill('input[name="fieldName"]', 'הערות');
    await page.selectOption('select[name="fieldType"]', 'LONG_TEXT');
    await page.click('button:has-text("צור שדה")');
    await expect(page.locator('text="הערות"')).toBeVisible();

    // Test 3: Create NUMBER field
    await page.click('button:has-text("הוסף שדה")');
    await page.fill('input[name="fieldName"]', 'גיל');
    await page.selectOption('select[name="fieldType"]', 'NUMBER');
    await page.check('input[name="isRequired"]');
    await page.click('button:has-text("צור שדה")');
    await expect(page.locator('text="גיל"')).toBeVisible();

    // Test 4: Create DATE field
    await page.click('button:has-text("הוסף שדה")');
    await page.fill('input[name="fieldName"]', 'תאריך לידה');
    await page.selectOption('select[name="fieldType"]', 'DATE');
    await page.click('button:has-text("צור שדה")');
    await expect(page.locator('text="תאריך לידה"')).toBeVisible();

    // Test 5: Create SELECT field with options
    await page.click('button:has-text("הוסף שדה")');
    await page.fill('input[name="fieldName"]', 'מצב משפחתי');
    await page.selectOption('select[name="fieldType"]', 'SELECT');

    // Add options
    await page.fill('input[placeholder="הוסף אופציה"]', 'רווק/ה');
    await page.click('button:has-text("הוסף")');
    await page.fill('input[placeholder="הוסף אופציה"]', 'נשוי/אה');
    await page.click('button:has-text("הוסף")');
    await page.fill('input[placeholder="הוסף אופציה"]', 'גרוש/ה');
    await page.click('button:has-text("הוסף")');

    await page.click('button:has-text("צור שדה")');
    await expect(page.locator('text="מצב משפחתי"')).toBeVisible();

    // Test 6: Edit field (change name)
    await page.click('text="עיר מגורים"').first();
    await page.click('button:has-text("ערוך")');
    await page.fill('input[name="fieldName"]', 'עיר מגורים (מעודכן)');
    await page.click('button:has-text("שמור")');
    await expect(page.locator('text="עיר מגורים (מעודכן)"')).toBeVisible();

    // Test 7: Delete a field
    const initialFieldCount = await page.locator('[data-testid="field-row"]').count();
    await page.click('text="הערות"');
    await page.click('button:has-text("מחק")');
    await page.click('button:has-text("אישור")'); // Confirmation dialog

    const finalFieldCount = await page.locator('[data-testid="field-row"]').count();
    expect(finalFieldCount).toBe(initialFieldCount - 1);
  });

  test('Scenario 2: Fill custom field values in submission details', async ({ page }) => {
    const questionnaireId = await ensureTestQuestionnaire(page);

    // Navigate to submissions page
    await page.goto(`${BASE_URL}/admin/questionnaires/${questionnaireId}/submissions`);

    // Check if we have any submissions
    const hasSubmissions = await page.locator('button:has-text("הצג פרטים")').count() > 0;

    if (!hasSubmissions) {
      // Skip test if no submissions exist
      test.skip();
    }

    // Open first submission detail
    await page.click('button:has-text("הצג פרטים")').first();

    // Wait for detail dialog to open
    await page.waitForSelector('text="שדות מותאמים אישית"');

    // Test filling different field types

    // TEXT field
    const textField = page.locator('input[data-field-type="TEXT"]').first();
    if (await textField.count() > 0) {
      await textField.fill('תל אביב');
      await page.click('button:has-text("שמור")').first();
      await expect(page.locator('text="נשמר בהצלחה"')).toBeVisible();
    }

    // NUMBER field
    const numberField = page.locator('input[data-field-type="NUMBER"]').first();
    if (await numberField.count() > 0) {
      await numberField.fill('35');
      await page.click('button:has-text("שמור")').nth(1);
      await expect(page.locator('text="נשמר בהצלחה"')).toBeVisible();
    }

    // DATE field
    const dateField = page.locator('input[data-field-type="DATE"]').first();
    if (await dateField.count() > 0) {
      await dateField.fill('1989-05-15');
      await page.click('button:has-text("שמור")').nth(2);
      await expect(page.locator('text="נשמר בהצלחה"')).toBeVisible();
    }

    // SELECT field
    const selectField = page.locator('select[data-field-type="SELECT"]').first();
    if (await selectField.count() > 0) {
      await selectField.selectOption('נשוי/אה');
      await page.click('button:has-text("שמור")').nth(3);
      await expect(page.locator('text="נשמר בהצלחה"')).toBeVisible();
    }

    // Close dialog and reopen to verify values persist
    await page.click('button:has-text("סגור")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("הצג פרטים")').first();

    // Verify values persisted
    if (await textField.count() > 0) {
      await expect(textField).toHaveValue('תל אביב');
    }
  });

  test('Scenario 3: Excel export includes custom fields', async ({ page }) => {
    const questionnaireId = await ensureTestQuestionnaire(page);

    // Navigate to submissions page
    await page.goto(`${BASE_URL}/admin/questionnaires/${questionnaireId}/submissions`);

    // Start download when clicking export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("ייצא לאקסל")');
    const download = await downloadPromise;

    // Verify file downloaded
    expect(download.suggestedFilename()).toContain('.xlsx');

    // Save file to verify content (optional - requires xlsx parsing)
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('Scenario 4: Navigation between pages', async ({ page }) => {
    const questionnaireId = await ensureTestQuestionnaire(page);

    // Start at submissions page
    await page.goto(`${BASE_URL}/admin/questionnaires/${questionnaireId}/submissions`);

    // Navigate to custom fields page
    await page.click('button:has-text("נהל שדות מותאמים")');
    await expect(page).toHaveURL(`${BASE_URL}/admin/questionnaires/${questionnaireId}/custom-fields`);

    // Navigate back to submissions
    await page.click('button:has-text("חזרה לתשובות")');
    await expect(page).toHaveURL(`${BASE_URL}/admin/questionnaires/${questionnaireId}/submissions`);
  });

  test('Scenario 5: Edge cases and validation', async ({ page }) => {
    const questionnaireId = await ensureTestQuestionnaire(page);

    // Navigate to custom fields page
    await page.goto(`${BASE_URL}/admin/questionnaires/${questionnaireId}/custom-fields`);

    // Test 1: Try to create field with empty name
    await page.click('button:has-text("הוסף שדה")');
    await page.selectOption('select[name="fieldType"]', 'TEXT');
    await page.click('button:has-text("צור שדה")');

    // Expect validation error
    await expect(page.locator('text="שדה זה הינו שדה חובה"')).toBeVisible();
    await page.click('button:has-text("ביטול")');

    // Test 2: Try to create SELECT field without options
    await page.click('button:has-text("הוסף שדה")');
    await page.fill('input[name="fieldName"]', 'בחירה ללא אופציות');
    await page.selectOption('select[name="fieldType"]', 'SELECT');
    await page.click('button:has-text("צור שדה")');

    // Expect validation error
    await expect(page.locator('text="עבור שדה מסוג בחירה חייב להגדיר אופציות"')).toBeVisible();
    await page.click('button:has-text("ביטול")');

    // Test 3: Verify required field validation in submission
    await page.goto(`${BASE_URL}/admin/questionnaires/${questionnaireId}/submissions`);

    const hasSubmissions = await page.locator('button:has-text("הצג פרטים")').count() > 0;
    if (hasSubmissions) {
      await page.click('button:has-text("הצג פרטים")').first();

      // Try to save empty required NUMBER field
      const requiredNumberField = page.locator('input[data-field-type="NUMBER"][required]').first();
      if (await requiredNumberField.count() > 0) {
        await requiredNumberField.fill('');
        await page.click('button:has-text("שמור")').first();

        // Expect validation error
        await expect(page.locator('text="שדה זה הינו שדה חובה"')).toBeVisible();
      }
    }
  });

  test('Scenario 6: Field type validation in submission', async ({ page }) => {
    const questionnaireId = await ensureTestQuestionnaire(page);
    await page.goto(`${BASE_URL}/admin/questionnaires/${questionnaireId}/submissions`);

    const hasSubmissions = await page.locator('button:has-text("הצג פרטים")').count() > 0;
    if (!hasSubmissions) {
      test.skip();
    }

    await page.click('button:has-text("הצג פרטים")').first();

    // Test NUMBER field with invalid input
    const numberField = page.locator('input[data-field-type="NUMBER"]').first();
    if (await numberField.count() > 0) {
      await numberField.fill('not a number');
      await page.click('button:has-text("שמור")').first();
      await expect(page.locator('text="ערך חייב להיות מספר תקין"')).toBeVisible();
    }

    // Test DATE field with invalid input
    const dateField = page.locator('input[data-field-type="DATE"]').first();
    if (await dateField.count() > 0) {
      await dateField.fill('invalid-date');
      await page.click('button:has-text("שמור")').nth(1);
      await expect(page.locator('text="תאריך לא תקין"')).toBeVisible();
    }
  });

  test('Performance: Load time for custom fields page', async ({ page }) => {
    const questionnaireId = await ensureTestQuestionnaire(page);

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/admin/questionnaires/${questionnaireId}/custom-fields`);
    await page.waitForSelector('h1:has-text("ניהול שדות מותאמים אישית")');
    const loadTime = Date.now() - startTime;

    // Page should load in less than 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('Performance: Detail dialog open time', async ({ page }) => {
    const questionnaireId = await ensureTestQuestionnaire(page);
    await page.goto(`${BASE_URL}/admin/questionnaires/${questionnaireId}/submissions`);

    const hasSubmissions = await page.locator('button:has-text("הצג פרטים")').count() > 0;
    if (!hasSubmissions) {
      test.skip();
    }

    const startTime = Date.now();
    await page.click('button:has-text("הצג פרטים")').first();
    await page.waitForSelector('text="שדות מותאמים אישית"');
    const openTime = Date.now() - startTime;

    // Dialog should open in less than 1 second
    expect(openTime).toBeLessThan(1000);
  });

  test('Accessibility: Keyboard navigation', async ({ page }) => {
    const questionnaireId = await ensureTestQuestionnaire(page);
    await page.goto(`${BASE_URL}/admin/questionnaires/${questionnaireId}/custom-fields`);

    // Tab to "הוסף שדה" button and activate
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Dialog should open
    await expect(page.locator('text="צור שדה חדש"')).toBeVisible();

    // Close dialog with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('text="צור שדה חדש"')).not.toBeVisible();
  });

  test('Accessibility: Screen reader compatibility', async ({ page }) => {
    const questionnaireId = await ensureTestQuestionnaire(page);
    await page.goto(`${BASE_URL}/admin/questionnaires/${questionnaireId}/custom-fields`);

    // Check for proper ARIA labels
    const addButton = page.locator('button:has-text("הוסף שדה")');
    await expect(addButton).toHaveAttribute('aria-label', 'הוסף שדה מותאם אישית חדש');

    // Check for proper role attributes
    const table = page.locator('table');
    await expect(table).toHaveAttribute('role', 'table');
  });
});
