# Research: Fix Frontend E2E Tests

**Branch**: `001-fix-e2e-tests` | **Date**: 2026-02-20

---

## Decision 1: Popover DOM Role

**Decision**: The shadcn/ui `Popover` (built on `@base-ui/react/popover`) renders the `PopoverContent` as a `<div data-slot="popover-content">` with **no ARIA role** by default.

**Rationale**: Base UI's `PopoverPrimitive.Popup` is intentionally unstyled and role-agnostic. It does not inject `role="dialog"` or `role="menu"`. The current tests use `[role="dialog"], [role="menu"]` which will never match the TypePicker popover.

**Alternatives considered**: `role="dialog"` (shadcn/ui's Dialog/AlertDialog only), `role="menu"` (DropdownMenu only), `role="listbox"` (cmdk CommandList only within the popover).

**Correct selector**: `[data-slot="popover-content"]` or, when the popover wraps a Command, wait for the Command's contents to be visible.

---

## Decision 2: Command / CommandItem DOM Role

**Decision**: `CommandItem` (from cmdk via shadcn/ui `Command`) renders with `role="option"`.

**Rationale**: The cmdk library sets `role="option"` on each item and `role="combobox"` on the root `Command` input. The tests' `[role="option"]` selectors are correct for finding CommandItems.

**Alternatives considered**: `[data-slot="command-item"]` (works but less semantic).

---

## Decision 3: TypePicker Trigger in FlagCreateRow

**Decision**: The "+ Type" trigger in `FlagCreateRow` renders as a `<div>` (from `FlagElement` using `useRender` with `defaultTagName: "div"`), NOT a `<button>`. The tests use `button:has-text("Type")` which will never match this element.

**Rationale**: `FlagElement` wraps `useRender` with `defaultTagName: "div"`. When used as the `PopoverTrigger`'s `render` prop, the resulting DOM element is a `<div>`. The tests' `button:has-text("Type")` CSS selector requires a `<button>` tag.

**Fix**: Add `data-testid="type-picker-trigger"` to the `FlagElement` in `FlagCreateRow`, then test with `page.locator('[data-testid="type-picker-trigger"]')`.

Note: The "Manage Types" button IS a `<Button>` component (renders as `<button>`), so `button:has-text("Manage Types")` is correct and does not need fixing.

---

## Decision 4: Edit Button in TypePicker Manage Mode

**Decision**: The pencil edit button inside each enum type's CommandItem has `aria-label="Edit {TypeName}"` and **no visible text**. The test uses `filter({ hasText: 'Edit' })` which matches visible text content, not aria-labels.

**Rationale**: The button renders as `<Button variant="ghost" size="icon-sm" aria-label="Edit {et.name}"><Pencil /></Button>`. There is no visible text "Edit". In manage mode, each enum type row has exactly one button (the pencil), so `statusTypeItem.locator('button').first()` is sufficient.

**Fix**: Replace `filter({ hasText: 'Edit' })` with `.first()` since the pencil button is the only button within each CommandItem in manage mode.

---

## Decision 5: Value Input Selectors in EnumTypeModal

**Decision**: The test's `modal.locator('input').first()` incorrectly targets the **name input** (which comes first in DOM order), not the first value input. The name input has `placeholder="e.g. Environment"` and appears before the value inputs in the DOM.

**Rationale**: DOM order within the modal: (1) name input `[placeholder="e.g. Environment"]`, then (2+) value inputs `[placeholder="Value..."]` from `EnumValueList`. `.first()` gets index 0, which is the name input.

**Impact**: ALL tests (T019–T021) overwrite the enum type name with the first value string (e.g., name becomes "production"/"active"/"gold" instead of "Environment"/"Status"/"Tier"), and the actual value inputs are filled at wrong indices.

**Fix**: Use `modal.locator('input[placeholder="Value..."]').nth(N)` for value inputs instead of `modal.locator('input').nth(N)`.

---

## Decision 6: `filter({ near: ... })` is Not a Valid Playwright API

**Decision**: Playwright's `locator.filter()` does NOT accept a `near` option. The tests' `filter({ near: flagRow })` calls are silently a no-op — the near constraint is ignored, and the locator matches any element globally.

**Rationale**: `locator.filter()` only accepts `has`, `hasNot`, `hasText`, `hasNotText`. There is no `near` option in Playwright's locator API (as of 2026).

**Impact**: In T019, `page.locator('text=production').filter({ near: flagRow }).first()` matches any element on the page with the text "production". With the SEED_FLAGS having no "production" text, this likely works accidentally when there's only one match, but is fragile.

**Fix**: Scope the value control selector to the flag's `<li>` element: `page.locator('li').filter({ hasText: 'MyEnumFlag' }).getByRole('combobox')`.

---

## Decision 7: Enum Value SelectTrigger Role

**Decision**: The enum flag value control in `FlagRow` uses shadcn/ui `<SelectTrigger>` which renders with `role="combobox"`. The existing `[role="combobox"]` selector in the tests is correct.

**Rationale**: Radix UI's `SelectTrigger` sets `role="combobox"` on the trigger button. SelectItem renders as `[role="option"]` within the SelectContent.

**Alternatives considered**: No change needed for the value control role itself, only scoping to the correct row.

---

## Decision 8: Confirmation Dialogs

**Decision**: AlertDialog renders with `role="alertdialog"`. The current tests search `[role="dialog"], [role="alertdialog"]` which is correct, but can be simplified to `[role="alertdialog"]` to avoid ambiguity.

**Rationale**: shadcn/ui `AlertDialog` (from Radix) renders `AlertDialogContent` with `role="alertdialog"`. The `Dialog` (EnumTypeModal) renders with `role="dialog"`. By the time the confirmation dialog appears, the original modal is closed, so both selectors might work, but `[role="alertdialog"]` is more precise.

**Confirmation button texts**:
- Value removal: AlertDialogAction button text = "Remove value"
- Type deletion: AlertDialogAction button text = "Delete"

---

## Decision 9: State Isolation Between Tests

**Decision**: No additional store reset mechanism is needed. Playwright's default behavior — each test gets a fresh `page` object (new browser context, fresh JS runtime) — is sufficient to reset the in-memory Zustand store.

**Rationale**: The Zustand store is a module-level singleton. A new browser page creates a fresh JavaScript runtime, so the store is re-initialized from `SEED_PROJECTS`, `SEED_FLAGS`, and `enumTypes: []` on each test. The `page.goto('/')` in `beforeEach` ensures the app loads from scratch.

**Caveat**: SEED_FLAGS contains pre-existing flags: "dark-mode" and "new-checkout" in proj-1, "beta-dashboard" in proj-2. Tests must account for this initial state (e.g., don't assert "No flags yet" empty state at the start).

---

## Decision 10: Flag Row `<li>` as Scoping Anchor

**Decision**: Use `page.locator('li').filter({ hasText: 'FlagName' })` to find a specific flag's row element, then scope all further selectors within it.

**Rationale**: `FlagRow` renders as `<li>` elements. The flag name appears in a `<span>` inside a nested div within the `<li>`. Since the `<li>` contains the flag's name text uniquely, it serves as a reliable scoping anchor for finding value controls, buttons, etc.

**Example**: `page.locator('li').filter({ hasText: 'MyEnumFlag' }).getByRole('combobox')` finds the SelectTrigger for a specific enum flag row.

---

## Summary: Bug Inventory (T019–T023)

| Bug | Test(s) | Current (broken) | Fixed |
|-----|---------|-----------------|-------|
| Popover role | T019, T020, T021 | `[role="dialog"],[role="menu"]` for TypePicker | `[data-slot="popover-content"]` |
| `+ Type` trigger tag | T019–T023 | `button:has-text("Type")` | `[data-testid="type-picker-trigger"]` |
| Edit button text | T020, T021 | `.filter({ hasText: 'Edit' })` | `.first()` (only button in row) |
| Value input index | T019–T021 | `modal.locator('input').first()` | `modal.locator('input[placeholder="Value..."]').first()` |
| `filter({ near })` | T019 | Not a valid Playwright API | `locator('li').filter(...).getByRole(...)` |
| Flag row scoping | T019, T020 | `filter({ near: flagRow })` ignored | Scoped `<li>` locator |

**Changes to source components**:
- `flag-create-row.tsx`: Add `data-testid="type-picker-trigger"` to the FlagElement trigger
