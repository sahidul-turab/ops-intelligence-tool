import { test, expect } from '@playwright/test';

test.describe('Dashboard Filters', () => {
    test('Employee Autocomplete should show suggestions and allow selection', async ({ page }) => {
        // 1. Navigate to the dashboard
        await page.goto('/');

        // 2. Locate the Employee Filter input
        const employeeInput = page.locator('#employeeFilter');
        await expect(employeeInput).toBeVisible();

        // 3. Type to trigger suggestions
        // "a" is a safe bet to match something in most mock datasets
        await employeeInput.fill('a');
        await employeeInput.focus();

        // 4. Wait for suggestions to appear
        const suggestionsDropdown = page.locator('.absolute.z-50'); // The dropdown container class
        await expect(suggestionsDropdown).toBeVisible();

        // 5. Select the first suggestion
        const firstSuggestion = suggestionsDropdown.locator('button').first();
        const suggestionText = await firstSuggestion.innerText();

        console.log(`Selecting suggestion: ${suggestionText}`);
        await firstSuggestion.click();

        // 6. Verify the input now contains the selected name
        await expect(employeeInput).toHaveValue(suggestionText);
    });

    test('Department Autocomplete should show suggestions and allow selection', async ({ page }) => {
        // 1. Navigate to the dashboard
        await page.goto('/');

        // 2. Locate the Department Filter input
        const deptInput = page.locator('#subTeamFilter');
        await expect(deptInput).toBeVisible();

        // 3. Type to trigger suggestions
        await deptInput.fill('O'); // Trying 'O' for "Operations" or similar
        await deptInput.focus();

        // 4. Wait for suggestions to appear
        const suggestionsDropdown = page.locator('.absolute.z-50');
        await expect(suggestionsDropdown).toBeVisible();

        // 5. Select the first suggestion
        const firstSuggestion = suggestionsDropdown.locator('button').first();
        const suggestionText = await firstSuggestion.innerText();

        console.log(`Selecting department: ${suggestionText}`);
        await firstSuggestion.click();

        // 6. Verify the input now contains the selected department
        await expect(deptInput).toHaveValue(suggestionText);
    });
});
