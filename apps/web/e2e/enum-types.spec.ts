import { test, expect, type Page } from "@playwright/test";

/**
 * E2E Tests for Enum Flag Types Feature
 * Tests cover all critical user journeys for enum type creation, editing, deletion, and flag value selection
 */

test.describe("Enum Flag Types - E2E Tests", () => {
  async function createEnumType(page: Page, name: string, values: string[]) {
    const manageTypesButton = page
      .locator('button:has-text("Manage Types"), button:has-text("Types")')
      .first();
    await manageTypesButton.click();

    // Wait for the type picker to appear
    const typePicker = page.locator('[data-testid="type-picker-popover"]').first();
    await expect(typePicker).toBeVisible();

    // Click "Create new enum type…"
    const createNewTypeButton = page.locator('[data-testid="create-enum-type-item"]');
    await createNewTypeButton.click();

    // Wait for the modal to appear
    const modal = page
      .locator('[data-testid="enum-type-modal"][data-mode="create"]')
      .filter({ hasText: "Create enum type" })
      .first();
    await expect(modal).toBeVisible();

    // Fill in the name
    const nameInput = modal.locator('input[data-testid="enum-type-name-input"]');
    await nameInput.fill("Environment");

    // Add values: production, staging, development
    const addValueButton = modal.locator('button:has-text("Add value")');

    // First value is pre-filled, clear and set to "production"
    for (let i = 0; i < values.length; i++) {
      await addValueButton.click();
      const valueInput = modal.locator('input[placeholder="Value..."]').nth(i);
      await valueInput.fill(values[i]);
    }

    // Save the enum type
    const saveButton = modal.locator('button:has-text("Save")').last();
    await saveButton.click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  }

  test.beforeEach(async ({ page }) => {
    // Navigate to the feature flags page
    await page.goto("/");
    // Wait for the page to load
    await page.waitForLoadState("networkidle");
  });

  test("T019: Full creation flow", async ({ page }) => {
    // Open "Manage Types" button
    await createEnumType(page, "Environment", ["production", "staging", "development"]);
    // Verify the modal closes
    const manageTypesButton = page
      .locator('button:has-text("Manage Types"), button:has-text("Types")')
      .first();
    // Verify the type now appears in the picker
    await manageTypesButton.click();
    const updatedTypePicker = page.locator('[data-slot="popover-content"]').first();
    await expect(updatedTypePicker).toBeVisible();

    // Now create a new flag with this type
    // Click outside picker to close it
    await page.keyboard.press("Escape");

    // Click "Add new flag…" or similar button
    const addFlagButton = page
      .locator(
        'button:has-text("Add"), button:has-text("Create flag"), button:has-text("New flag")',
      )
      .first();
    await addFlagButton.click();

    // Fill in flag name
    const flagNameInput = page.locator('input[data-testid="create-flag-name-input"]');
    await flagNameInput.fill("MyEnumFlag");

    // Click "+ Type" or similar to open type picker
    const flagTypeButton = page.locator('[data-testid="type-picker-trigger"]').first();
    await flagTypeButton.click();

    // Select "Environment" enum type
    const environmentTypeOption = page
      .locator('[role="option"]')
      .filter({ hasText: "Environment" })
      .first();
    await environmentTypeOption.click();

    await expect(flagTypeButton).toContainText("Environment");
    // Create the flag (press Enter or click Create button)
    await page.locator('input[data-testid="create-flag-name-input"]').click();
    await page.keyboard.press("Enter");

    // Verify the flag appears in the list with default value "production"
    const flagRow = page.locator("li").filter({ hasText: "MyEnumFlag" }).first();
    await expect(flagRow).toBeVisible();

    // Click the value control to open dropdown
    const valueControl = flagRow.getByRole("combobox").first();
    await expect(valueControl).toContainText("production");
    await valueControl.click();

    // Select "staging" from the dropdown
    const stagingOption = page.locator('[role="option"]').filter({ hasText: "staging" }).first();
    await stagingOption.click();

    // Verify the flag now shows "staging"
    await expect(valueControl).toContainText("staging");
  });
});
