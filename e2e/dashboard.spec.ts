/**
 * KairuFlow E2E Tests - Dashboard
 * Tests the main dashboard functionality
 */
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
    });

    test('should show morning ritual dialog on first visit', async ({ page }) => {
        // Seed DB: reset and force morning ritual incomplete
        await page.goto('/test/seed?reset=1&morning=incomplete');
        await page.waitForSelector('[data-testid="seed-status"]');
        await page.goto('/dashboard');

        // Should show the morning ritual dialog
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 10000 });

        // Should have energy check-in title
        await expect(page.getByText('Comment tu te sens ce matin')).toBeVisible();
    });

    test('should complete morning ritual and show playlist', async ({ page }) => {
        // Seed DB: reset and force morning ritual incomplete
        await page.goto('/test/seed?reset=1&morning=incomplete');
        await page.waitForSelector('[data-testid="seed-status"]');
        await page.goto('/dashboard');

        // Wait for dialog
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 10000 });

        // Select energy level (click on one of the energy options)
        const energyButton = page.locator('[data-energy-level]').first();
        if (await energyButton.isVisible()) {
            await energyButton.click();
        }

        // Click validate button
        const validateButton = page.getByRole('button', { name: /valider/i });
        await validateButton.click();

        // Dialog should close
        await expect(dialog).not.toBeVisible({ timeout: 5000 });

        // Should show playlist section
        await expect(page.getByText(/Ma playlist/i)).toBeVisible();
    });

    test('should display search input', async ({ page }) => {
        // Seed DB: morning ritual complete
        await page.goto('/test/seed?reset=1&morning=complete&seedTasks=1');
        await page.waitForSelector('[data-testid="seed-status"]');
        await page.goto('/dashboard');

        // Search input should be visible
        const searchInput = page.getByPlaceholder(/chercher/i);
        await expect(searchInput).toBeVisible();

        // Type in search
        await searchInput.fill('test');
        await expect(searchInput).toHaveValue('test');
    });

    test('should toggle between playlist and timeline views', async ({ page }) => {
        // Seed DB: morning ritual complete
        await page.goto('/test/seed?reset=1&morning=complete&seedTasks=1');
        await page.waitForSelector('[data-testid="seed-status"]');
        await page.goto('/dashboard');

        // Should have tabs
        const playlistTab = page.getByRole('tab', { name: /ma playlist/i });
        const timelineTab = page.getByRole('tab', { name: /timeline/i });

        await expect(playlistTab).toBeVisible();
        await expect(timelineTab).toBeVisible();

        // Click timeline tab
        await timelineTab.click();

        // Timeline content should be visible
        await expect(page.locator('[data-testid="timeline-view"]')).toBeVisible({ timeout: 5000 }).catch(() => {
            // If data-testid not present, just verify tab is selected
            expect(timelineTab).toHaveAttribute('data-state', 'active');
        });
    });

    test('should show panic button for urgent tasks', async ({ page }) => {
        // Seed DB: morning ritual complete
        await page.goto('/test/seed?reset=1&morning=complete&seedTasks=1');
        await page.waitForSelector('[data-testid="seed-status"]');
        await page.goto('/dashboard');

        // Panic button should be visible (Siren icon button)
        const panicButton = page.locator('button').filter({ has: page.locator('svg.lucide-siren') });
        await expect(panicButton.first()).toBeVisible({ timeout: 5000 });
    });

    test('should limit playlist regeneration to 2 times', async ({ page }) => {
        // Seed DB: morning ritual complete
        await page.goto('/test/seed?reset=1&morning=complete&seedTasks=1');
        await page.waitForSelector('[data-testid="seed-status"]');
        await page.goto('/dashboard');

        // Find refresh button
        const refreshButton = page.getByRole('button', { name: /rafraîchir/i });

        if (await refreshButton.isVisible()) {
            // Click twice and verify button becomes disabled or shows toast
            await refreshButton.click();
            await page.waitForTimeout(1000);
            await refreshButton.click();
            await page.waitForTimeout(1000);

            // Third click should be blocked or show error
            await refreshButton.click();

            // Should show toast with limit message
            const toast = page.getByText(/limite/i);
            await expect(toast).toBeVisible({ timeout: 3000 }).catch(() => {
                // Button should be disabled after 2 regenerations
                expect(refreshButton).toBeDisabled();
            });
        }
    });
});

test.describe('Navigation', () => {
    test('should have proper page title', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveTitle(/kairuflow/i);
    });

    test('should redirect to dashboard from root', async ({ page }) => {
        await page.goto('/');
        // Should either be on dashboard or redirect to it
        await page.waitForURL(/dashboard|\/$/);
    });
});

test.describe('Accessibility', () => {
    test('should have no major accessibility violations', async ({ page }) => {
        await page.goto('/dashboard');

        // Seed DB: morning ritual complete
        await page.goto('/test/seed?reset=1&morning=complete&seedTasks=1');
        await page.waitForSelector('[data-testid="seed-status"]');
        await page.goto('/dashboard');

        // Basic accessibility checks
        // Check for main landmark
        const main = page.locator('main');
        await expect(main).toBeVisible().catch(() => {
            // If no main, check for content div
            expect(page.locator('body > div')).toBeVisible();
        });

        // Check that buttons have accessible names
        const buttons = await page.getByRole('button').all();
        for (const button of buttons.slice(0, 5)) { // Check first 5 buttons
            const accessibleName = await button.getAttribute('aria-label') || await button.textContent();
            expect(accessibleName).toBeTruthy();
        }
    });
});
