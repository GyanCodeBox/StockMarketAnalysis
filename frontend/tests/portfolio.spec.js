import { test, expect } from '@playwright/test';

test.describe('Portfolio View', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/portfolio', { waitUntil: 'networkidle' });
    });

    test('should display portfolio header and input', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('Portfolio View');
        await expect(page.getByRole('button', { name: 'Run Portfolio Scan' })).toBeVisible();
    });

    test('should run scan and show results table', async ({ page }) => {
        const input = page.locator('textarea');
        await input.waitFor({ state: 'visible' });
        await input.fill('RELIANCE, TCS');

        await page.getByRole('button', { name: 'Run Portfolio Scan' }).click();

        // Wait for the table to appear
        await expect(page.locator('table')).toBeVisible({ timeout: 60000 });

        // Check for stock symbols in the table
        await expect(page.locator('table')).toContainText('RELIANCE');
        await expect(page.locator('table')).toContainText('TCS');
    });

    test('should navigate to stock detail on row click', async ({ page }) => {
        const input = page.locator('textarea');
        await input.waitFor({ state: 'visible' });
        await input.fill('RELIANCE');
        await page.getByRole('button', { name: 'Run Portfolio Scan' }).click();

        const firstRow = page.locator('tbody tr').first();
        await expect(firstRow).toBeVisible({ timeout: 60000 });
        await firstRow.click();

        // Should navigate to terminal
        await expect(page).toHaveURL(/.*analyze\/RELIANCE.*/, { timeout: 10000 });
        await expect(page.locator('h1')).toContainText('TERMINAL');
    });
});
