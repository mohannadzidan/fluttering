# Tasks: Fix Frontend E2E Tests

**Input**: Design documents from `/specs/001-fix-e2e-tests/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: No new test tasks — the entire feature IS the test fix. Each implementation task restores a broken test.

**Organization**: One task per broken Playwright test (T019–T023), plus one foundational source change that unblocks all type-picker selector fixes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Exact file paths are included in all descriptions

## Path Conventions

**Monorepo (pnpm workspaces)**:
- Test file: `apps/web/e2e/enum-types.spec.ts`
- Source components: `apps/web/src/features/feature-flags/components/`

---

## Phase 1: Setup

No setup tasks required — Playwright is already configured in the project (`apps/web/playwright.config.ts`), and all browsers are assumed installed. The existing `beforeEach` with `page.goto('/')` correctly resets the in-memory Zustand store (fresh browser page per test = fresh JS runtime per test).

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: The single source-code change that all test selector fixes in Phase 3 depend on.

**⚠️ CRITICAL**: The type picker trigger in `FlagCreateRow` renders as a `<div>` (not a `<button>`) because it is built with `FlagElement` / `useRender`. All five tests attempt to locate this element with `button:has-text("Type")`, which will always fail. Adding a `data-testid` is the only reliable, tag-agnostic way to target this element.

- [ ] T001 Add `data-testid="type-picker-trigger"` attribute to the `FlagElement` used as the `TypePicker` `trigger` prop in `apps/web/src/features/feature-flags/components/flag-list/flag-create-row.tsx` (line ~136–147)

**Checkpoint**: Source change committed. All tests can now reference `[data-testid="type-picker-trigger"]` instead of `button:has-text("Type")`.

---

## Phase 3: User Story 1 — E2E Test Suite Runs Green (Priority: P1) 🎯 MVP

**Goal**: All five tests pass with correct selectors and no silent failures due to invalid Playwright APIs.

**Independent Test**: Run `pnpm -F web exec playwright test --project=chromium` — all 5 tests should pass in a single browser before cross-browser validation.

### Implementation for User Story 1

- [ ] T002 [US1] Fix T019 "Full creation flow" in `apps/web/e2e/enum-types.spec.ts`:
  - Replace `[role="dialog"], [role="menu"]` type picker locator (line 22) with `[data-slot="popover-content"]`
  - Replace `modal.locator('input').first()` (line 41) with `modal.locator('input[placeholder="Value..."]').first()` for the first value input
  - Replace `modal.locator('input').nth(1)` (line 47) with `modal.locator('input[placeholder="Value..."]').nth(1)` for the second value input
  - Replace `modal.locator('input').nth(2)` (line 51) with `modal.locator('input[placeholder="Value..."]').nth(2)` for the third value input
  - Replace `button:has-text("Type"), button:has-text("+ Type")` (line 79) with `[data-testid="type-picker-trigger"]`
  - Replace `page.locator('[role="dialog"], [role="menu"]').filter({ hasText: 'Environment' })` (line 63) with `page.locator('[data-slot="popover-content"]')`
  - Replace `page.locator('text=production').filter({ near: flagRow })` (line 92) with `page.locator('li').filter({ hasText: 'MyEnumFlag' }).getByRole('combobox')`
  - Replace `page.locator('[role="combobox"], [role="button"]').filter({ near: flagRow })` (line 96) with the same `li`-scoped `getByRole('combobox')` locator
  - Replace `page.locator('text=staging').filter({ near: flagRow })` (line 104) with an assertion on the same `getByRole('combobox')` that it now shows "staging"

- [ ] T003 [US1] Fix T020 "Edit with value removal" in `apps/web/e2e/enum-types.spec.ts`:
  - Replace the `[role="dialog"], [role="menu"]` type picker locator (implicit in setup block) with `[data-slot="popover-content"]`
  - Replace `modal.locator('input').first()` (line 121) with `modal.locator('input[placeholder="Value..."]').first()`
  - Replace `modal.locator('input').nth(1)` (line 125) with `modal.locator('input[placeholder="Value..."]').nth(1)`
  - Replace `modal.locator('input').nth(2)` (line 129) with `modal.locator('input[placeholder="Value..."]').nth(2)`
  - Replace `button:has-text("Type"), button:has-text("+ Type")` (line 147) with `[data-testid="type-picker-trigger"]` inside the creation loop
  - Replace `page.locator('[role="combobox"], [role="button"]').filter({ near: flagRow })` (line 161) with `page.locator('li').filter({ hasText: 'StatusFlag1' })` (and 'StatusFlag2') `.getByRole('combobox')`
  - Replace `statusTypeItem.locator('button, [role="button"]').filter({ hasText: 'Edit' }).first()` (line 173) with `statusTypeItem.locator('button').first()` (only one button per CommandItem in manage mode)
  - Replace the fallback `statusTypeItem.locator('button').first().click()` (lines 174–179) with a single `statusTypeItem.locator('button').first().click()`
  - Replace `page.locator('[role="dialog"], [role="alertdialog"]').filter({ hasText: /flag.*will be reset|Confirm/ })` (line 196) with `page.locator('[role="alertdialog"]')`
  - Replace `page.locator('text=active').filter({ near: statusFlag1Row })` (lines 211–215) with `page.locator('li').filter({ hasText: 'StatusFlag1' }).getByRole('combobox')` and assert `toContainText('active')`

- [ ] T004 [US1] Fix T021 "Delete with cascade" in `apps/web/e2e/enum-types.spec.ts`:
  - Replace the type picker locator with `[data-slot="popover-content"]`
  - Replace `modal.locator('input').first()` (line 232) with `modal.locator('input[placeholder="Value..."]').first()`
  - Replace `modal.locator('input').nth(1)` (line 235) with `modal.locator('input[placeholder="Value..."]').nth(1)`
  - Replace `button:has-text("Type"), button:has-text("+ Type")` (line ~252) with `[data-testid="type-picker-trigger"]` inside the creation loop
  - Replace `tierTypeItem.locator('button, [role="button"]').filter({ hasText: 'Edit' }).first()` (line 265) with `tierTypeItem.locator('button').first()`
  - Remove the `if (await editButton.isVisible())` branch; use `.click()` directly on `tierTypeItem.locator('button').first()`
  - Replace `page.locator('[role="dialog"], [role="alertdialog"]').filter({ hasText: /Delete|flag.*will.*delete/ })` (line 280) with `page.locator('[role="alertdialog"]')`
  - Replace `deleteConfirmDialog.locator('button:has-text("Delete"), button:has-text("Confirm")').first()` (line 288) with `page.locator('[role="alertdialog"]').locator('button', { hasText: 'Delete' }).last()` (last because AlertDialogFooter has Cancel then Delete)

- [ ] T005 [US1] Fix T022 "Inline creation row gates" in `apps/web/e2e/enum-types.spec.ts`:
  - Replace `button:has-text("Type"), button:has-text("+ Type")` (lines 327, 355) with `[data-testid="type-picker-trigger"]`
  - Replace `creationRow.locator('button:has-text("Type"), button:has-text("+ Type")')` with `page.locator('[data-testid="type-picker-trigger"]')` (the trigger is outside the `li`, at the same level)
  - Replace `typeModal.locator('input').first()` (line 367) with `typeModal.locator('input[placeholder="Value..."]').first()`
  - Verify the `createButton` locator (`creationRow.locator('button:has-text("Create")')`) still resolves — the Create button IS a `<button>` element, so this selector is correct; confirm no change needed

- [ ] T006 [US1] Verify T023 "Escape and click-outside dismissal" in `apps/web/e2e/enum-types.spec.ts`:
  - This test does NOT use the TypePicker trigger, enum type modal value inputs, or `filter({ near })`, so it may already pass
  - Read the test (lines 389–427) and confirm all selectors are valid
  - If the `addFlagButton` selector `button:has-text("Add")` partially matches "Add new flag..." — verify this is correct (Playwright `has-text` does substring matching, so it should work)
  - Make any corrections needed; if test is already correct, document that no changes were needed

**Checkpoint**: All five tests pass with `pnpm -F web exec playwright test --project=chromium`

---

## Phase 4: User Story 2 — Selector Stability (Priority: P2) + User Story 3 — State Isolation (Priority: P3)

**Goal (US2)**: Confirm each selector resolves to exactly one element with no ambiguity or timeout. **Goal (US3)**: Confirm fresh-state isolation between tests via Playwright's default page-per-test behavior.

**Independent Test**: Run each test individually with `--grep "T0XX"` — each must pass in isolation.

### Implementation for User Story 2 + 3

- [ ] T007 [P] [US2] Run T019 in isolation and verify it passes: `pnpm -F web exec playwright test --grep "T019" --project=chromium` — if it fails, identify any remaining selector issues in `apps/web/e2e/enum-types.spec.ts` and fix them

- [ ] T008 [P] [US2] Run T020 in isolation and verify it passes: `pnpm -F web exec playwright test --grep "T020" --project=chromium` — if it fails, identify remaining issues in `apps/web/e2e/enum-types.spec.ts` and fix them

- [ ] T009 [P] [US2] Run T021 in isolation and verify it passes: `pnpm -F web exec playwright test --grep "T021" --project=chromium` — if it fails, identify remaining issues in `apps/web/e2e/enum-types.spec.ts` and fix them

- [ ] T010 [P] [US2] Run T022 in isolation and verify it passes: `pnpm -F web exec playwright test --grep "T022" --project=chromium` — if it fails, identify remaining issues in `apps/web/e2e/enum-types.spec.ts` and fix them

- [ ] T011 [P] [US2] Run T023 in isolation and verify it passes: `pnpm -F web exec playwright test --grep "T023" --project=chromium` — if it fails, identify remaining issues in `apps/web/e2e/enum-types.spec.ts` and fix them

- [ ] T012 [US3] Run T019 followed immediately by T020 (in-order, same worker): `pnpm -F web exec playwright test --grep "T019|T020" --project=chromium --workers=1` — verify T020 passes even after T019 has run, confirming state isolation is effective

**Checkpoint**: All five tests pass individually and sequentially — state isolation confirmed, selectors confirmed unambiguous

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Full cross-browser validation and final confirmation.

- [ ] T013 Run the full Playwright suite across all three browsers: `pnpm -F web exec playwright test` — expected result: 15 tests pass (5 tests × 3 browsers: Chromium, Firefox, WebKit), 0 failures, 0 retries used

- [ ] T014 [P] Verify TypeScript types still compile with no errors: `pnpm -F web lint` — confirm the `data-testid` prop addition to `flag-create-row.tsx` is type-safe (React DOM accepts `data-*` on any element)

- [ ] T015 [P] Open Playwright HTML report and review each test's trace for timing warnings: `pnpm -F web exec playwright show-report` — if any test shows excessive wait times (>2s on a single action), add an explicit `await expect(element).toBeVisible()` guard before that interaction in `apps/web/e2e/enum-types.spec.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — nothing to do
- **Phase 2 (Foundational)**: No dependencies — start immediately with T001
- **Phase 3 (US1)**: Depends on T001 — the `data-testid` must exist before test fixes that use `[data-testid="type-picker-trigger"]`
  - T002, T003, T004, T005 can be done sequentially (all in the same file)
  - T006 can be done in parallel with any of T002–T005 (only reads/verifies, does not conflict if done concurrently by a second person)
- **Phase 4 (US2/US3)**: Depends on Phase 3 completion (T002–T006)
  - T007–T011 are all [P] — can run simultaneously once Phase 3 is done
  - T012 depends on T007 and T008 (or at least T002 and T003)
- **Phase 5 (Polish)**: Depends on Phase 4 completion
  - T013: Must run after all selector fixes are in
  - T014, T015: [P] — can run simultaneously with T013

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational (T001). No dependencies on US2 or US3.
- **US2 (P2)**: Depends on US1 implementation being complete (T002–T006). Verification only.
- **US3 (P3)**: Depends on US1 being complete. Verifies isolation using existing behavior.

### Within Phase 3

- T002–T005 share one file (`enum-types.spec.ts`) — edit sequentially to avoid conflicts
- T006 (verify T023) can be done any time after Phase 2

### Parallel Opportunities

- T007, T008, T009, T010, T011 are all [P] — run simultaneously in Phase 4 (different test IDs, no shared state)
- T014 and T015 are [P] — run simultaneously in Phase 5

---

## Parallel Example: Phase 4 (Verification)

```bash
# After Phase 3 is complete, run all isolation checks in parallel:
pnpm -F web exec playwright test --grep "T019" --project=chromium  # Terminal 1
pnpm -F web exec playwright test --grep "T020" --project=chromium  # Terminal 2
pnpm -F web exec playwright test --grep "T021" --project=chromium  # Terminal 3
pnpm -F web exec playwright test --grep "T022" --project=chromium  # Terminal 4
pnpm -F web exec playwright test --grep "T023" --project=chromium  # Terminal 5
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Add `data-testid` (T001)
2. Fix T019 (T002) — the most comprehensive test; fixes all bug classes
3. **STOP and VALIDATE**: `pnpm -F web exec playwright test --grep "T019" --project=chromium`
4. If T019 passes, the pattern for all remaining fixes is established; continue T003–T006

### Incremental Delivery

1. T001 → enables all test fixes
2. T002 (T019) → validates the complete fix pattern for enum type creation + flag creation + value selection
3. T003 (T020) → validates edit + value removal + confirmation dialog
4. T004 (T021) → validates delete + cascade + confirmation dialog
5. T005 (T022) → validates creation row gate logic
6. T006 (T023) → validates dismiss behavior (likely no changes needed)
7. T007–T012 → isolation verification
8. T013–T015 → full cross-browser + linting sign-off

---

## Notes

- `[P]` tasks in Phase 4 are different test IDs run in separate terminals — no file conflicts
- `[US1]` tasks all touch the same file (`enum-types.spec.ts`) — edit sequentially
- The key insight from `research.md`: `modal.locator('input').first()` is the highest-impact bug — it corrupts ALL enum type names (T019–T021), making types unsaveable with the correct values
- State isolation (US3) requires no implementation work: Playwright already provides a fresh page per test, resetting the in-memory Zustand store
- After T001, commit before starting Phase 3 to allow clean rollback if needed
- Each test fix in Phase 3 should be verified locally with `--grep "T0XX" --headed` to observe the test flow before moving to the next
