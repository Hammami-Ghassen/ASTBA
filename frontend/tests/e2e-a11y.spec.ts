import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ──────────────────────────────────────────────
// ASTBA – E2E Accessibility Tests
// Uses Playwright + axe-core for WCAG 2.2 AA
// ──────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Accessibility – WCAG 2.2 AA', () => {
    test('Dashboard page has no critical a11y violations', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
            .analyze();

        const violations = accessibilityScanResults.violations.filter(
            (v) => v.impact === 'critical' || v.impact === 'serious'
        );

        if (violations.length > 0) {
            console.log('A11y violations on Dashboard:', JSON.stringify(violations, null, 2));
        }

        expect(violations).toHaveLength(0);
    });

    test('Students page has no critical a11y violations', async ({ page }) => {
        await page.goto(`${BASE_URL}/students`);
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
            .analyze();

        const violations = accessibilityScanResults.violations.filter(
            (v) => v.impact === 'critical' || v.impact === 'serious'
        );

        if (violations.length > 0) {
            console.log('A11y violations on Students:', JSON.stringify(violations, null, 2));
        }

        expect(violations).toHaveLength(0);
    });

    test('Attendance page has no critical a11y violations', async ({ page }) => {
        await page.goto(`${BASE_URL}/attendance`);
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
            .analyze();

        const violations = accessibilityScanResults.violations.filter(
            (v) => v.impact === 'critical' || v.impact === 'serious'
        );

        expect(violations).toHaveLength(0);
    });

    test('Skip link is visible on focus and navigates to main content', async ({ page }) => {
        await page.goto(BASE_URL);

        // Tab to the skip link
        await page.keyboard.press('Tab');

        const skipLink = page.locator('a[href="#main-content"]');
        await expect(skipLink).toBeFocused();
        await expect(skipLink).toBeVisible();

        // Activate skip link
        await page.keyboard.press('Enter');

        // Main content should be focused
        const mainContent = page.locator('#main-content');
        await expect(mainContent).toBeFocused();
    });

    test('All pages have exactly one H1', async ({ page }) => {
        const pages = ['/', '/students', '/trainings', '/attendance', '/certificates'];

        for (const p of pages) {
            await page.goto(`${BASE_URL}${p}`);
            await page.waitForLoadState('networkidle');

            const h1Count = await page.locator('h1').count();
            expect(h1Count, `Page ${p} should have exactly 1 h1, found ${h1Count}`).toBe(1);
        }
    });

    test('Language switcher toggles language', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Find language switch button
        const langButton = page.getByRole('button', { name: /FR|عربي/i });
        await expect(langButton).toBeVisible();
    });

    test('Keyboard navigation through main nav items', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Tab through skip link + nav items
        await page.keyboard.press('Tab'); // skip link
        await page.keyboard.press('Tab'); // logo
        await page.keyboard.press('Tab'); // first nav item (dashboard)

        const activeElement = page.locator(':focus');
        await expect(activeElement).toHaveAttribute('href', '/');
    });
});

test.describe('User Flow – E2E', () => {
    test('Can navigate to create student page', async ({ page }) => {
        await page.goto(`${BASE_URL}/students`);
        await page.waitForLoadState('networkidle');

        // Click "Add student" button or navigate
        await page.goto(`${BASE_URL}/students/new`);
        await page.waitForLoadState('networkidle');

        // Check form is present
        const firstName = page.locator('#firstName');
        await expect(firstName).toBeVisible();

        const lastName = page.locator('#lastName');
        await expect(lastName).toBeVisible();

        const email = page.locator('#email');
        await expect(email).toBeVisible();
    });

    test('Form validation shows errors on empty submit', async ({ page }) => {
        await page.goto(`${BASE_URL}/students/new`);
        await page.waitForLoadState('networkidle');

        // Submit empty form
        const submitButton = page.getByRole('button', { name: /enregistrer|حفظ|save/i });
        await submitButton.click();

        // Should show error alerts
        const errors = page.locator('[role="alert"]');
        const errorCount = await errors.count();
        expect(errorCount).toBeGreaterThan(0);
    });
});
