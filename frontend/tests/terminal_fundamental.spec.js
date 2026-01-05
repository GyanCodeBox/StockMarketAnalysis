import { test, expect } from '@playwright/test';

test.describe('Terminal and Fundamental Views', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for the h1 to be visible to ensure the page is loaded
        await expect(page.locator('h1')).toContainText('TERMINAL');
    });

    test('should load stock data and display technical analysis', async ({ page }) => {
        const input = page.getByLabel(/Stock Symbol/i);
        await input.fill('RELIANCE');
        await page.getByRole('button', { name: 'ANALYZE' }).click();

        // Wait for StockInfo or Stock name to appear
        await expect(page.getByRole('heading', { name: 'RELIANCE' })).toBeVisible({ timeout: 20000 });

        // Verify technical analysis tab is active by default
        const techTab = page.getByRole('button', { name: 'Technical Analysis' });
        await expect(techTab).toHaveClass(/bg-indigo-600/);

        // Verify Regime Banner
        await expect(page.locator('text=Market Structure').first()).toBeVisible({ timeout: 20000 });
        await expect(page.locator('text=Technical Strength')).toBeVisible({ timeout: 20000 });
        await expect(page.locator('canvas').first()).toBeVisible();

        // Performance Timing Check
        const performanceTiming = await page.evaluate(() => {
            const { loadEventEnd, navigationStart } = window.performance.timing;
            return loadEventEnd - navigationStart;
        });
        console.log(`Page Load Time: ${performanceTiming}ms`);
        expect(performanceTiming).toBeLessThan(3000); // Should load within 3s
    });

    test('should switch timeframes', async ({ page }) => {
        const input = page.getByLabel(/Stock Symbol/i);
        await input.fill('TCS');
        await page.getByRole('button', { name: 'ANALYZE' }).click();

        await expect(page.getByRole('heading', { name: 'TCS' })).toBeVisible({ timeout: 20000 });

        const timeframeSelect = page.locator('select#timeframe');
        await timeframeSelect.selectOption('week');
        await page.getByRole('button', { name: 'ANALYZE' }).click();

        // Verify it stays on TCS
        await expect(page.getByRole('heading', { name: 'TCS' })).toBeVisible({ timeout: 20000 });
    });

    test('should toggle chart overlays', async ({ page }) => {
        const input = page.getByLabel(/Stock Symbol/i);
        await input.fill('INFY');
        await page.getByRole('button', { name: 'ANALYZE' }).click();

        await expect(page.getByRole('heading', { name: 'INFY' })).toBeVisible({ timeout: 20000 });

        // Toggle Zones
        const zonesButton = page.getByTitle('Toggle accumulation zones');
        await expect(zonesButton).toBeVisible();
        const initialText = await zonesButton.innerText();
        await zonesButton.click();
        await expect(zonesButton).not.toHaveText(initialText);
    });

    test('should navigate to fundamental analysis and show data', async ({ page }) => {
        const input = page.getByLabel(/Stock Symbol/i);
        await input.fill('RELIANCE');
        await page.getByRole('button', { name: 'ANALYZE' }).click();

        await expect(page.getByRole('heading', { name: 'RELIANCE' })).toBeVisible({ timeout: 20000 });

        // Click Fundamental Analysis tab
        await page.getByRole('button', { name: 'Fundamental Analysis' }).click();
        await page.waitForLoadState('networkidle');

        // Verify Fundamental h2
        const fundamentalHeading = page.getByRole('heading', { name: 'Fundamental Analysis', exact: true });
        await expect(fundamentalHeading).toBeVisible();

        // Verify Health Banner (score) exists
        await expect(page.getByText('Business Performance & Quality Score')).toBeVisible({ timeout: 20000 });

        // Check for some fundamental metric label
        await expect(page.getByText(/Regime Diagnostic/i)).toBeVisible({ timeout: 20000 });
    });

    test('should navigate to decision intelligence', async ({ page }) => {
        const input = page.getByLabel(/Stock Symbol/i);
        await input.fill('RELIANCE');
        await page.getByRole('button', { name: 'ANALYZE' }).click();

        await expect(page.getByRole('heading', { name: 'RELIANCE' })).toBeVisible({ timeout: 20000 });

        // Click Decision Intelligence tab
        await page.getByRole('button', { name: 'Decision Intelligence' }).click();
        await page.waitForLoadState('networkidle');

        // Verify h2
        const decisionHeading = page.getByRole('heading', { name: 'Decision Intelligence', exact: true });
        await expect(decisionHeading).toBeVisible();
        await expect(page.getByText('Regime Confluence')).toBeVisible({ timeout: 20000 });
    });
});
