import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Enum Flag Types Feature
 * Tests cover all critical user journeys for enum type creation, editing, deletion, and flag value selection
 */

test.describe('Enum Flag Types - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the feature flags page
    await page.goto('/');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('T019: Full creation flow', async ({ page }) => {
    // Open "Manage Types" button
    const manageTypesButton = page.locator('button:has-text("Manage Types"), button:has-text("Types")').first();
    await manageTypesButton.click();

    // Wait for the type picker to appear
    const typePicker = page.locator('[data-slot="popover-content"]').first();
    await expect(typePicker).toBeVisible();

    // Click "Create new enum type…"
    const createNewTypeButton = page.locator('button, [role="option"]').filter({ hasText: 'Create new enum type' }).first();
    await createNewTypeButton.click();

    // Wait for the modal to appear
    const modal = page.locator('[role="dialog"]').filter({ hasText: 'Create enum type' }).first();
    await expect(modal).toBeVisible();

    // Fill in the name
    const nameInput = modal.locator('input[placeholder="e.g. Environment"]');
    await nameInput.fill('Environment');

    // Add values: production, staging, development
    const addValueButton = modal.locator('button:has-text("Add value")');

    // First value is pre-filled, clear and set to "production"
    const firstValueInput = modal.locator('input[placeholder="Value..."]').first();
    await firstValueInput.fill('production');

    // Add second value
    await addValueButton.click();
    const secondValueInput = modal.locator('input[placeholder="Value..."]').nth(1);
    await secondValueInput.fill('staging');

    // Add third value
    await addValueButton.click();
    const thirdValueInput = modal.locator('input[placeholder="Value..."]').nth(2);
    await thirdValueInput.fill('development');

    // Save the enum type
    const saveButton = modal.locator('button:has-text("Save")').last();
    await saveButton.click();

    // Verify the modal closes
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Verify the type now appears in the picker
    await manageTypesButton.click();
    const updatedTypePicker = page.locator('[data-slot="popover-content"]').first();
    await expect(updatedTypePicker).toBeVisible();

    // Now create a new flag with this type
    // Click outside picker to close it
    await page.keyboard.press('Escape');

    // Click "Add new flag…" or similar button
    const addFlagButton = page.locator('button:has-text("Add"), button:has-text("Create flag"), button:has-text("New flag")').first();
    await addFlagButton.click();

    // Fill in flag name
    const flagNameInput = page.locator('input').first();
    await flagNameInput.fill('MyEnumFlag');

    // Click "+ Type" or similar to open type picker
    const flagTypeButton = page.locator('[data-testid="type-picker-trigger"]').first();
    await flagTypeButton.click();

    // Select "Environment" enum type
    const environmentTypeOption = page.locator('[role="option"]').filter({ hasText: 'Environment' }).first();
    await environmentTypeOption.click();

    // Create the flag (press Enter or click Create button)
    await page.keyboard.press('Enter');

    // Verify the flag appears in the list with default value "production"
    const flagRow = page.locator('li').filter({ hasText: 'MyEnumFlag' }).first();
    await expect(flagRow).toBeVisible();

    // Click the value control to open dropdown
    const valueControl = flagRow.getByRole('combobox').first();
    await expect(valueControl).toContainText('production');
    await valueControl.click();

    // Select "staging" from the dropdown
    const stagingOption = page.locator('[role="option"]').filter({ hasText: 'staging' }).first();
    await stagingOption.click();

    // Verify the flag now shows "staging"
    await expect(valueControl).toContainText('staging');
  });

  test('T020: Edit with value removal', async ({ page }) => {
    // Create an enum type "Status" with values ["active", "inactive", "pending"]
    const manageTypesButton = page.locator('button:has-text("Manage Types"), button:has-text("Types")').first();
    await manageTypesButton.click();

    const createNewTypeButton = page.locator('button, [role="option"]').filter({ hasText: 'Create new enum type' }).first();
    await createNewTypeButton.click();

    const modal = page.locator('[role="dialog"]').filter({ hasText: 'Create enum type' }).first();
    const nameInput = modal.locator('input[placeholder="e.g. Environment"]');
    await nameInput.fill('Status');

    const addValueButton = modal.locator('button:has-text("Add value")');
    const firstValueInput = modal.locator('input[placeholder="Value..."]').first();
    await firstValueInput.fill('active');

    await addValueButton.click();
    const secondValueInput = modal.locator('input[placeholder="Value..."]').nth(1);
    await secondValueInput.fill('inactive');

    await addValueButton.click();
    const thirdValueInput = modal.locator('input[placeholder="Value..."]').nth(2);
    await thirdValueInput.fill('pending');

    const saveButton = modal.locator('button:has-text("Save")').last();
    await saveButton.click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Close picker
    await page.keyboard.press('Escape');

    // Create 2 flags with "Status" type, both set to "inactive"
    for (let i = 1; i <= 2; i++) {
      const addFlagButton = page.locator('button:has-text("Add"), button:has-text("Create flag"), button:has-text("New flag")').first();
      await addFlagButton.click();

      const flagNameInput = page.locator('input').first();
      await flagNameInput.fill(`StatusFlag${i}`);

      const flagTypeButton = page.locator('[data-testid="type-picker-trigger"]').first();
      await flagTypeButton.click();

      const statusTypeOption = page.locator('[role="option"]').filter({ hasText: 'Status' }).first();
      await statusTypeOption.click();

      // Now set the value to "inactive"
      // After selection, the flag is created with default "active", we need to change it
      await page.keyboard.press('Enter');

      // Wait for flag to appear and change value
      const flagRow = page.locator('li').filter({ hasText: 'StatusFlag' + i }).first();
      await expect(flagRow).toBeVisible();

      const valueControl = flagRow.getByRole('combobox').first();
      await valueControl.click();

      const inactiveOption = page.locator('[role="option"]').filter({ hasText: 'inactive' }).first();
      await inactiveOption.click();
    }

    // Now edit the "Status" type and remove "inactive"
    await manageTypesButton.click();

    // Find and click the edit icon for "Status" type
    const statusTypeItem = page.locator('[role="option"]').filter({ hasText: 'Status' }).first();
    const editButton = statusTypeItem.locator('button').first();
    await editButton.click();

    // Edit modal should open
    const editModal = page.locator('[role="dialog"]').filter({ hasText: 'Edit enum type' }).first();
    await expect(editModal).toBeVisible();

    // Find and remove the "inactive" value
    const inactiveInput = editModal.locator('input').filter({ hasValue: 'inactive' }).first();
    const inactiveRow = inactiveInput.locator('..').first();
    const removeButton = inactiveRow.locator('button').last();
    await removeButton.click();

    // Save the changes
    const savEditButton = editModal.locator('button:has-text("Save")').last();
    await savEditButton.click();

    // Confirmation dialog should appear asking about affected flags
    const confirmDialog = page.locator('[role="alertdialog"]').first();
    await expect(confirmDialog).toBeVisible();

    // Verify warning shows "2 flag(s)"
    const warningText = confirmDialog.locator('text=/2 flag/');
    await expect(warningText).toBeVisible();

    // Confirm the removal
    const confirmButton = confirmDialog.locator('button:has-text("Remove value"), button:has-text("Continue"), button:has-text("Confirm")').first();
    await confirmButton.click();

    // Verify both flags now show "active" (the new default)
    const statusFlag1Row = page.locator('li').filter({ hasText: 'StatusFlag1' }).first();
    const statusFlag2Row = page.locator('li').filter({ hasText: 'StatusFlag2' }).first();

    const activeValue1 = statusFlag1Row.getByRole('combobox').first();
    const activeValue2 = statusFlag2Row.getByRole('combobox').first();

    await expect(activeValue1).toContainText('active');
    await expect(activeValue2).toContainText('active');
  });

  test('T021: Delete with cascade', async ({ page }) => {
    // Create enum type "Tier"
    const manageTypesButton = page.locator('button:has-text("Manage Types"), button:has-text("Types")').first();
    await manageTypesButton.click();

    const createNewTypeButton = page.locator('button, [role="option"]').filter({ hasText: 'Create new enum type' }).first();
    await createNewTypeButton.click();

    const modal = page.locator('[role="dialog"]').filter({ hasText: 'Create enum type' }).first();
    const nameInput = modal.locator('input[placeholder="e.g. Environment"]');
    await nameInput.fill('Tier');

    const addValueButton = modal.locator('button:has-text("Add value")');
    const firstValueInput = modal.locator('input[placeholder="Value..."]').first();
    await firstValueInput.fill('gold');

    await addValueButton.click();
    const secondValueInput = modal.locator('input[placeholder="Value..."]').nth(1);
    await secondValueInput.fill('silver');

    const saveButton = modal.locator('button:has-text("Save")').last();
    await saveButton.click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    await page.keyboard.press('Escape');

    // Create 3 flags with "Tier" type
    for (let i = 1; i <= 3; i++) {
      const addFlagButton = page.locator('button:has-text("Add"), button:has-text("Create flag"), button:has-text("New flag")').first();
      await addFlagButton.click();

      const flagNameInput = page.locator('input').first();
      await flagNameInput.fill(`TierFlag${i}`);

      const flagTypeButton = page.locator('[data-testid="type-picker-trigger"]').first();
      await flagTypeButton.click();

      const tierTypeOption = page.locator('[role="option"]').filter({ hasText: 'Tier' }).first();
      await tierTypeOption.click();

      await page.keyboard.press('Enter');
    }

    // Open Manage Types again and edit "Tier"
    await manageTypesButton.click();

    const tierTypeItem = page.locator('[role="option"]').filter({ hasText: 'Tier' }).first();
    const editButton = tierTypeItem.locator('button').first();
    await editButton.click();

    const editModal = page.locator('[role="dialog"]').filter({ hasText: 'Edit enum type' }).first();
    await expect(editModal).toBeVisible();

    // Click Delete button
    const deleteButton = editModal.locator('button:has-text("Delete")').first();
    await deleteButton.click();

    // Delete confirmation dialog should appear
    const deleteConfirmDialog = page.locator('[role="alertdialog"]').first();
    await expect(deleteConfirmDialog).toBeVisible();

    // Verify warning shows "3 flag(s)"
    const warningText = deleteConfirmDialog.locator('text=/3 flag/');
    await expect(warningText).toBeVisible();

    // Confirm deletion
    const confirmDeleteButton = page.locator('[role="alertdialog"]').locator('button', { hasText: 'Delete' }).last();
    await confirmDeleteButton.click();

    // Verify "Tier" is gone from type picker
    await manageTypesButton.click();
    const tierTypeItemAfter = page.locator('[role="option"]').filter({ hasText: 'Tier' });
    await expect(tierTypeItemAfter).not.toBeVisible();

    await page.keyboard.press('Escape');

    // Verify all 3 flags are removed from the flag list
    const tierFlag1 = page.locator('text=TierFlag1');
    const tierFlag2 = page.locator('text=TierFlag2');
    const tierFlag3 = page.locator('text=TierFlag3');

    await expect(tierFlag1).not.toBeVisible();
    await expect(tierFlag2).not.toBeVisible();
    await expect(tierFlag3).not.toBeVisible();
  });

  test('T022: Inline creation row gates', async ({ page }) => {
    // Click "Add new flag…"
    const addFlagButton = page.locator('button:has-text("Add"), button:has-text("Create flag"), button:has-text("New flag")').first();
    await addFlagButton.click();

    const creationRow = page.locator('input').first().locator('..').first();

    // Create button should be disabled
    const createButton = creationRow.locator('button:has-text("Create")').first();
    await expect(createButton).toBeDisabled();

    // Type a flag name
    const flagNameInput = page.locator('input').first();
    await flagNameInput.fill('TestFlag');

    // Create button should still be disabled
    await expect(createButton).toBeDisabled();

    // Click "+ Type"
    const typeButton = page.locator('[data-testid="type-picker-trigger"]').first();
    await typeButton.click();

    // Select Boolean
    const booleanOption = page.locator('[role="option"]').filter({ hasText: 'Boolean' }).first();
    await booleanOption.click();

    // Create button should now be enabled
    await expect(createButton).toBeEnabled();

    // Press Enter to create
    await page.keyboard.press('Enter');

    // Flag should appear in list
    const flagRow = page.locator('text=TestFlag').first();
    await expect(flagRow).toBeVisible();

    // Now repeat with enum type
    const addFlagButton2 = page.locator('button:has-text("Add"), button:has-text("Create flag"), button:has-text("New flag")').first();
    await addFlagButton2.click();

    const flagNameInput2 = page.locator('input').first();
    await flagNameInput2.fill('TestEnumFlag');

    const createButton2 = page.locator('button:has-text("Create")').first();
    await expect(createButton2).toBeDisabled();

    // First create an enum type to select
    const typeButton2 = page.locator('[data-testid="type-picker-trigger"]').first();
    await typeButton2.click();

    // Create new enum type from the picker
    const createNewTypeOption = page.locator('[role="option"]').filter({ hasText: 'Create new enum type' }).first();
    if (await createNewTypeOption.isVisible()) {
      await createNewTypeOption.click();

      const typeModal = page.locator('[role="dialog"]').filter({ hasText: 'Create enum type' }).first();
      const typeNameInput = typeModal.locator('input[placeholder="e.g. Environment"]');
      await typeNameInput.fill('TestType');

      const typeValueInput = typeModal.locator('input[placeholder="Value..."]').first();
      await typeValueInput.fill('value1');

      const typeSaveButton = typeModal.locator('button:has-text("Save")').last();
      await typeSaveButton.click();
    } else {
      // Just select first available enum type
      const enumOption = page.locator('[role="option"]').first();
      await enumOption.click();
    }

    // Create button should now be enabled
    await expect(createButton2).toBeEnabled();

    // Press Enter to create
    await page.keyboard.press('Enter');

    // Flag should appear in list
    const enumFlagRow = page.locator('text=TestEnumFlag').first();
    await expect(enumFlagRow).toBeVisible();
  });

  test('T023: Escape and click-outside dismissal', async ({ page }) => {
    // Click "Add new flag…"
    const addFlagButton = page.locator('button:has-text("Add"), button:has-text("Create flag"), button:has-text("New flag")').first();
    await addFlagButton.click();

    const creationRow = page.locator('input').first().locator('..').first();

    // Type a partial name
    const flagNameInput = page.locator('input').first();
    await flagNameInput.fill('Partial');

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify the row disappears
    const partialFlagRow = page.locator('text=Partial');
    await expect(partialFlagRow).not.toBeVisible();

    // Open the creation row again
    await addFlagButton.click();

    const creationRow2 = page.locator('input').first().locator('..').first();

    // Type a partial name again
    const flagNameInput2 = page.locator('input').first();
    await flagNameInput2.fill('AnotherPartial');

    // Click outside the row
    const mainContent = page.locator('body').first();
    await mainContent.click({ position: { x: 10, y: 100 } });

    // Verify the row disappears
    const anotherPartialRow = page.locator('text=AnotherPartial');
    await expect(anotherPartialRow).not.toBeVisible();

    // Verify no flag was created
    const testFlagCheck = page.locator('text=/Partial|AnotherPartial/');
    await expect(testFlagCheck).not.toBeVisible();
  });
});
