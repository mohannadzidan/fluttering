# Quickstart: Fix Frontend E2E Tests

**Branch**: `001-fix-e2e-tests` | **Date**: 2026-02-20

## Prerequisites

- pnpm installed (workspace monorepo)
- Node.js 20+
- Playwright browsers installed: `pnpm -F web exec playwright install`

## Running the E2E Tests

```bash
# Start the frontend dev server (required for Playwright)
pnpm -F web dev

# In a second terminal, run E2E tests (all)
pnpm -F web exec playwright test

# Run a specific test by name
pnpm -F web exec playwright test --grep "T019"
pnpm -F web exec playwright test --grep "T020"

# Run with UI mode for debugging
pnpm -F web exec playwright test --ui

# Run with debug mode (headed, pause-on-failure)
pnpm -F web exec playwright test --headed --debug

# View the HTML report after a run
pnpm -F web exec playwright show-report
```

## Files to Modify

| File | Change Type |
|------|-------------|
| `apps/web/e2e/enum-types.spec.ts` | Selector fixes (primary) |
| `apps/web/src/features/feature-flags/components/flag-list/flag-create-row.tsx` | Add `data-testid="type-picker-trigger"` |

## Selector Fix Reference

### TypePicker Popover (not a dialog!)

```typescript
// ❌ Wrong — Popover has no role="dialog" or role="menu"
page.locator('[role="dialog"], [role="menu"]').filter({ hasText: 'Create new enum type' })

// ✅ Correct — Popover renders with data-slot="popover-content"
page.locator('[data-slot="popover-content"]')
```

### Type Picker Trigger in Creation Row

```typescript
// ❌ Wrong — the trigger is a <div>, not a <button>
page.locator('button:has-text("Type")')

// ✅ Correct — after adding data-testid to FlagCreateRow's FlagElement trigger
page.locator('[data-testid="type-picker-trigger"]')
```

### Value Inputs in EnumTypeModal

```typescript
// ❌ Wrong — modal.locator('input').first() gets the name input (DOM order: name → values)
const firstValueInput = modal.locator('input').first(); // gets name input!

// ✅ Correct — target value inputs by placeholder
const firstValueInput = modal.locator('input[placeholder="Value..."]').first();
const secondValueInput = modal.locator('input[placeholder="Value..."]').nth(1);
const thirdValueInput = modal.locator('input[placeholder="Value..."]').nth(2);
```

### Edit Button in Manage Mode TypePicker

```typescript
// ❌ Wrong — button has aria-label, not visible text "Edit"
statusTypeItem.locator('button').filter({ hasText: 'Edit' })

// ✅ Correct — only one button per CommandItem in manage mode
statusTypeItem.locator('button').first()
// OR
page.locator(`button[aria-label="Edit Status"]`)
```

### Flag Row Scoping (replaces filter({ near }))

```typescript
// ❌ Wrong — filter({ near }) is not a valid Playwright API
page.locator('text=production').filter({ near: flagRow }).first()

// ✅ Correct — scope within the flag's <li> element
const flagRow = page.locator('li').filter({ hasText: 'MyEnumFlag' });
const valueControl = flagRow.getByRole('combobox');
await expect(valueControl).toContainText('production');

// Select a new value
await valueControl.click();
await page.locator('[role="option"]').filter({ hasText: 'staging' }).click();
```

### Confirmation Dialogs

```typescript
// ✅ Value removal confirmation
const confirmDialog = page.locator('[role="alertdialog"]');
await expect(confirmDialog).toBeVisible();
// Warning text assertion
await expect(confirmDialog).toContainText('2 flags');
// Confirm button
await confirmDialog.locator('button', { hasText: 'Remove value' }).click();

// ✅ Type deletion confirmation
const deleteConfirmDialog = page.locator('[role="alertdialog"]');
await expect(deleteConfirmDialog).toBeVisible();
await expect(deleteConfirmDialog).toContainText('3 flags');
await deleteConfirmDialog.locator('button', { hasText: 'Delete' }).last().click();
```

## Verification

After making the changes, run the full suite and verify:

```bash
pnpm -F web exec playwright test

# Expected output:
# 5 passed (T019, T020, T021, T022, T023) × 3 browsers = 15 tests
# 0 failed
# 0 flaky
```

Run each test in isolation to confirm no cross-test dependencies:

```bash
pnpm -F web exec playwright test --grep "T019" --project=chromium
pnpm -F web exec playwright test --grep "T020" --project=chromium
pnpm -F web exec playwright test --grep "T021" --project=chromium
pnpm -F web exec playwright test --grep "T022" --project=chromium
pnpm -F web exec playwright test --grep "T023" --project=chromium
```
