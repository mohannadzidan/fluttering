# Tasks: Enum Flag Types

**Input**: Design documents from `/specs/004-enum-flag-types/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Vitest unit tests (Constitution §V — utility functions MUST have tests) and Playwright E2E tests (critical user journeys MUST be covered) are included per project constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Monorepo paths: `apps/web/src/features/feature-flags/` (all paths below are relative to this root unless noted)

---

## Phase 1: Setup (Dependencies & Scaffolding)

**Purpose**: Ensure required packages are present and the new component sub-folder exists.

- [ ] T001 Check if `@dnd-kit/helpers` is installed (`pnpm list @dnd-kit/helpers`); if missing, install it with `pnpm add @dnd-kit/helpers --filter @fluttering/web`
- [ ] T002 Check which shadcn/ui components are not yet installed (Dialog, AlertDialog, Command, Popover, Select); install any missing via `pnpm dlx shadcn@latest add <name>` from `apps/web/`
- [ ] T003 [P] Create the `components/enum-types/` directory (it can remain empty for now — will be populated in Phase 3)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the type system and Zustand store with enum support. Every user story depends on these changes being complete first.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Update `types/index.ts` — replace the `FeatureFlag<T extends FlagType>` generic with a discriminated union: define `BooleanFlag` (`type: "boolean"`, `value: boolean`), `EnumFlag` (`type: "enum"`, `enumTypeId: string`, `value: string`), and `type AnyFlag = BooleanFlag | EnumFlag`. Add the `EnumType` interface (`id`, `name`, `values: string[]`). Extend `FeatureFlagsState` with `enumTypes: EnumType[]`. Add new action signatures to `FeatureFlagsStore`: `createEnumType`, `updateEnumType`, `deleteEnumType`, `setEnumFlagValue`. Update `addFlag` signature to accept `type: "boolean" | "enum"` and optional `enumTypeId?: string`.

- [ ] T005 Update `store/index.ts` — implement all new actions (depends on T004):
  - Add `enumTypes: []` to initial state
  - `createEnumType(name, values)`: generate UUID, enforce name uniqueness (case-insensitive), enforce `values.length >= 1` and case-sensitive uniqueness within list, push to `enumTypes`
  - `updateEnumType(id, name, values)`: replace the matching type; after update, iterate all `flags` in all projects — for any `EnumFlag` with `enumTypeId === id` whose `value` is not in the new `values[]`, reset `value` to `values[0]`
  - `deleteEnumType(id)`: remove from `enumTypes`; for each project in `flags`, filter out all `EnumFlag`s where `enumTypeId === id`
  - `setEnumFlagValue(projectId, flagId, value)`: find the flag, verify it's an `EnumFlag` and `value` is in its type's `values[]`, set `flag.value = value`, refresh `updatedAt`
  - Update `addFlag` to construct `EnumFlag` when `type === "enum"` (initial `value = enumType.values[0]`)

- [ ] T006 [P] Create `utils/enum-type.ts` — pure, side-effect-free helper functions (depends on T004 types):
  - `isNameUnique(name: string, existing: EnumType[], excludeId?: string): boolean` — case-insensitive comparison
  - `areValuesUnique(values: string[]): boolean` — case-sensitive check
  - `getAffectedFlagCount(enumTypeId: string, flags: Record<string, AnyFlag[]>): number` — count of all `EnumFlag`s referencing this type across all projects
  - `getAffectedFlagsByValue(enumTypeId: string, value: string, flags: Record<string, AnyFlag[]>): number` — count of `EnumFlag`s with a specific value for this type
  - `wouldRemoveUsedValue(enumTypeId: string, removedValue: string, flags: Record<string, AnyFlag[]>): boolean` — returns true if any flag currently holds that value

- [ ] T007 [P] Create `utils/enum-type.test.ts` — Vitest unit tests for every function in `utils/enum-type.ts` (depends on T006):
  - `isNameUnique`: accepts unique name, rejects duplicate (case-insensitive), respects `excludeId`
  - `areValuesUnique`: accepts unique list, rejects duplicates (case-sensitive)
  - `getAffectedFlagCount`: returns 0 for no matches, correct count for N matching flags
  - `getAffectedFlagsByValue`: returns correct per-value count
  - `wouldRemoveUsedValue`: true when a flag holds the value, false when none do

- [ ] T008 Review `utils/flag-tree.ts` — confirm `buildRenderList`, `hasDescendant`, and `getDirectChildren` use only `flag.parentId` (not `flag.type` assumptions); if any utility assumes `flag.type === "boolean"` for traversal, patch it. Add test cases to `utils/flag-tree.test.ts` for `EnumFlag` nodes in the tree.

- [ ] T009 [P] Update `components/flag-type-icon.tsx` — add an icon case for `type === "enum"` (e.g., Lucide `ListFilter` or `ToggleRight`); ensure the existing `"boolean"` case is preserved

**Checkpoint**: Foundation ready — TypeScript compiles with zero errors, store actions exist (even if components haven't been wired yet), and all Vitest utility tests pass.

---

## Phase 3: User Story 1 — Define a New Enum Type (Priority: P1) 🎯 MVP Entry Point

**Goal**: A user can create a new enum type (name + ordered unique values) via the "Manage Types" button in the flag list toolbar. The created type persists in the store and immediately appears in the type list.

**Independent Test**: Click "Manage Types" in the toolbar → picker opens → click "Create new enum type…" → enter name "Environment" and values "production, staging, development" → save → the picker now lists "Environment" as an available type.

- [ ] T010 [US1] Create `components/enum-types/enum-value-list.tsx` — a sortable list of value rows for use inside the enum type modal. Each row contains: a drag handle, a text `<input>` showing the value, and a remove `<button>` (disabled when `values.length === 1`). Wrap the list in a scoped `DragDropProvider` from `@dnd-kit/react`; use `useSortable` per row; use `move` from `@dnd-kit/helpers` in `onDragEnd` to compute the new order. Emits `onChange(values: string[])`. The first item in the rendered list should be labeled "default" (read-only badge).

- [ ] T011 [US1] Create `components/enum-types/enum-type-modal.tsx` — a shadcn/ui `Dialog` supporting create mode (`enumType` prop = undefined). Contains: a name `<Input>`, an `EnumValueList`, an "Add value" button (appends an empty row), and Save / Cancel footer buttons. On Save: validate name uniqueness (`isNameUnique`) and values (`areValuesUnique`), enforce `values.length >= 1`, call `createEnumType(name, values)`, close modal. Displays inline error messages for violations. (Edit mode and delete button will be added in Phase 6.)

- [ ] T012 [US1] Create `components/enum-types/type-picker.tsx` — a shadcn/ui `Command` inside a `Popover` with a `mode: "assign" | "manage"` prop. In **manage mode**: lists all `enumTypes` from the store; each item has the type name and an edit icon (`<Pencil>`) that opens `EnumTypeModal` in edit mode; a "Create new enum type…" footer item opens `EnumTypeModal` in create mode. No `onSelect` callback in manage mode.

- [ ] T013 [US1] Update `components/flag-list/flag-list.tsx` — add a "Manage Types" button (or icon button labeled "Types") to the toolbar/header area above the flag list. Clicking it opens `TypePicker` in `mode="manage"` inside a controlled `Popover`. Wire open/close state locally.

**Checkpoint (US1)**: "Manage Types" button is visible → click → picker opens → "Create new enum type…" → fill modal → save → new type appears in picker list. Fully testable without any flag creation.

---

## Phase 4: User Story 2 — Assign a Type to a New Flag via Inline Creation (Priority: P1)

**Goal**: When a user creates a new flag, the inline creation row shows a "+ Type" element. The user can click it to open a type picker, select Boolean or an enum type, and the Create button activates only after both a name and a type are set. Enter key also creates the flag. Escape or clicking outside dismisses the row.

**Independent Test**: Click "Add new flag…" → creation row appears with "+ Type" and disabled Create button → type a name → Create still disabled → click "+ Type" → select "Boolean" → Create enables → press Enter → flag appears in list.

- [ ] T014 [US2] Extend `components/enum-types/type-picker.tsx` with **assign mode**: in `mode="assign"`, the picker shows a "Primitive Types" group with a "Boolean" item first, then an "Enum Types" group listing all `enumTypes`. Selecting any item calls `onSelect(type: "boolean" | "enum", enumTypeId?: string)` and closes the popover. The "Create new enum type…" footer item opens `EnumTypeModal` in create mode; after the modal saves, the new type is auto-selected and `onSelect` is called with the new type.

- [ ] T015 [US2] Rewrite `components/flag-list/flag-create-row.tsx` — redesign the creation row to match the UI of an existing flag row. Local state: `{ name: string, selectedType: "boolean" | "enum" | null, selectedEnumTypeId: string | null }`. Layout:
  - A flag name `<Input>` (auto-focused on mount)
  - A `FlagElement` that renders "+ Type" when `selectedType === null`, or a type preview chip (type name + first value) when a type is selected; clicking this `FlagElement` opens `TypePicker` in `mode="assign"` with `onSelect` updating local state
  - A "Create" `<Button>` at row end, disabled while `!name.trim() || selectedType === null`
  - On Create (button click or Enter when enabled): call `addFlag(projectId, name, selectedType, parentId, selectedEnumTypeId ?? undefined)` then call `onDone()`
  - On Escape key or `onBlur` from the row: call `onCancel()`

**Checkpoint (US2)**: Inline creation row fully functional for both Boolean and enum types. Create button and Enter key correctly gated. Escape dismisses without creating.

---

## Phase 5: User Story 3 — Select a Value for an Enum Flag (Priority: P1)

**Goal**: An enum flag row displays its current value. Clicking the value control opens a dropdown of all allowed values for that enum type. Selecting a value updates the flag immediately.

**Independent Test**: Create an enum flag (via US2). Confirm the row shows the default value. Click the value control → dropdown shows all enum type values → select a different one → row updates.

- [ ] T016 [US3] Update `components/flag-list/flag-row.tsx` — replace the `Switch` with a conditional render based on `flag.type`:
  - `"boolean"`: existing `Switch` (unchanged)
  - `"enum"`: render a shadcn/ui `Select` whose `value` is `flag.value`, whose items are all `enumType.values` (look up the `EnumType` via `flag.enumTypeId` from the store's `enumTypes`), and whose `onValueChange` calls `setEnumFlagValue(projectId, flag.id, newValue)`
  - Guard `toggleFlagValue` call site: ensure it only fires for `flag.type === "boolean"` (TypeScript narrowing should enforce this after T004, but confirm no runtime path reaches it for enum flags)

**Checkpoint (US3)**: All three P1 user stories are now independently functional. A user can create enum types, assign them to flags, and change flag values.

---

## Phase 6: User Story 4 — Edit an Existing Enum Type (Priority: P2)

**Goal**: From the type picker, a user can edit an existing enum type: rename it, add/remove/reorder values. Removing a value used by flags triggers a confirmation dialog; confirmed removal resets affected flags to the new default.

**Independent Test**: Create an enum type with 3 values, assign it to 2 flags each set to "staging". Open the type picker → edit the type → remove "staging" → confirm the warning ("2 flag(s) will be reset to 'production'") → save → both flags now show "production".

- [ ] T016 [US4] Update `components/enum-types/enum-type-modal.tsx` — add **edit mode** (prop `enumType: EnumType | undefined`): when `enumType` is provided, pre-fill name and values; show a "Delete" destructive button in the footer (wired in Phase 7). On Save in edit mode: compare original vs new values to detect removed values; for each removed value call `getAffectedFlagsByValue(enumTypeId, value, flags)` — if any flag is affected, show a shadcn/ui `AlertDialog` listing: "Removing '[value]' will reset X flag(s) to '[new default]'. Continue?" Proceed with `updateEnumType(id, name, values)` only after confirmation.

- [ ] T017 [US4] Update `components/enum-types/type-picker.tsx` — in manage mode, wire the edit icon next to each enum type to open `EnumTypeModal` with `enumType={selectedEnumType}` (edit mode). Manage the `editingEnumType` state locally in the picker.

**Checkpoint (US4)**: Edit flow complete including value-removal safety. Affected flags visibly reset to new default after confirmed edit.

---

## Phase 7: User Story 5 — Delete an Enum Type (Priority: P2)

**Goal**: From the edit modal, a user can delete an enum type. If flags use it, a warning shows the count; confirmed deletion removes the type and all associated flags.

**Independent Test**: Create an enum type used by 3 flags → open edit modal → click Delete → warning: "3 flag(s) use this type. Deleting it will also delete those flags." → confirm → type gone from picker, all 3 flags removed from list.

- [ ] T018 [US5] Update `components/enum-types/enum-type-modal.tsx` — wire the "Delete" button (footer, visible only in edit mode): on click, compute `getAffectedFlagCount(enumType.id, flags)`; show a shadcn/ui `AlertDialog`:
  - 0 flags: "Delete this enum type? This cannot be undone." → confirm → `deleteEnumType(id)` → close modal and picker
  - N > 0 flags: "N flag(s) use this type. Deleting it will also delete those flags. This cannot be undone." → confirm → `deleteEnumType(id)` → close modal and picker

**Checkpoint (US5)**: All 5 user stories are independently functional. Full cascade behavior verified.

---

## Phase 8: Playwright E2E Tests (Constitution §V)

**Purpose**: Cover all critical user journeys. These tests verify the integrated behavior that unit tests cannot cover.

- [ ] T019 [P] Write Playwright E2E test in `apps/web/e2e/` (or wherever existing E2E tests live): **Full creation flow** — open "Manage Types" → create enum type "Environment" with values ["production", "staging", "development"] → create new flag, assign "Environment" type → verify flag shows "production" (default) → click value selector → pick "staging" → verify "staging" is shown
- [ ] T020 [P] Write Playwright E2E test: **Edit with value removal** — create enum type "Status" with ["active", "inactive", "pending"] → create 2 flags set to "inactive" → edit "Status", remove "inactive" → confirm warning shows "2 flag(s)" → save → both flags now show "active"
- [ ] T021 [P] Write Playwright E2E test: **Delete with cascade** — create enum type "Tier" used by 3 flags → open edit modal → delete → confirm warning shows "3 flag(s)" → verify "Tier" is gone from type picker and all 3 flags are removed from the flag list
- [ ] T022 [P] Write Playwright E2E test: **Inline creation row gates** — click "Add new flag…" → Create button is disabled → type a flag name → still disabled → click "+ Type" → select Boolean → Create enables → press Enter → flag appears → repeat with an enum type selection
- [ ] T023 [P] Write Playwright E2E test: **Escape and click-outside dismissal** — open creation row → type a partial name → press Escape → row disappears, no flag created → open again → click outside the row → row disappears, no flag created

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final integration checks and cleanup.

- [ ] T024 [P] Verify enum flags render correctly as children of boolean parent flags: create a boolean parent flag → add an enum child flag under it → confirm the dashed connector renders and the enum value selector is visible in the indented row
- [ ] T025 Run full test suite: `pnpm --filter @fluttering/web test` (Vitest) and Playwright E2E suite; fix any failures before merging
- [ ] T026 [P] Review `apps/web/src/features/feature-flags/index.ts` — confirm that no new internal components were accidentally exported; the public surface should remain `FlagsLayout` only

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user story phases**
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on US1 (TypePicker component built in US1 is extended here)
- **US3 (Phase 5)**: Depends on US2 (enum flags must be creatable to test value selection)
- **US4 (Phase 6)**: Depends on US1 (EnumTypeModal edit mode extends Phase 3 modal)
- **US5 (Phase 7)**: Depends on US4 (delete button lives in the edit modal)
- **E2E Tests (Phase 8)**: Depends on all user stories complete (tests the integrated system)
- **Polish (Phase 9)**: Depends on E2E tests passing

### Story Dependency Chain

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational: types + store + utils)
    ↓
Phase 3 (US1: Manage Types → Create enum type modal)
    ↓
Phase 4 (US2: + Type picker on creation row)      Phase 6 (US4: Edit enum type modal)
    ↓                                                   ↓
Phase 5 (US3: Enum value selector on flag row)    Phase 7 (US5: Delete from edit modal)
    ↓                                                   ↓
Phase 8 (E2E Tests — all stories must be complete)
    ↓
Phase 9 (Polish)
```

> US3 and US4/US5 can proceed in parallel once US1 and US2 are done.

### Within Each Phase

- Tasks marked `[P]` within a phase can run simultaneously (different files, no shared dependencies)
- Non-`[P]` tasks within a phase depend on the previous task in that phase

### Parallel Opportunities

- **Phase 2**: T006 + T007 (utils) and T009 (flag-type-icon) can run in parallel alongside T008 (flag-tree review) after T004+T005 complete
- **Phase 8**: All E2E tests (T019–T023) can be written and run in parallel
- **Phase 9**: T024 and T026 can run in parallel alongside T025

---

## Parallel Execution Examples

### Phase 2 — After T004 + T005 complete

```
Parallel batch:
  T006 Create utils/enum-type.ts
  T007 Create utils/enum-type.test.ts
  T008 Review flag-tree.ts
  T009 Update flag-type-icon.tsx
```

### Phase 8 — All E2E tests

```
Parallel batch:
  T019 E2E: Full creation flow
  T020 E2E: Edit with value removal
  T021 E2E: Delete with cascade
  T022 E2E: Creation row gates
  T023 E2E: Escape / click-outside dismissal
```

---

## Implementation Strategy

### MVP (P1 Stories Only — Phases 1–5 + T019 + T022)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — **do not skip**
3. Complete Phase 3: US1 (create enum type via Manage Types)
4. Complete Phase 4: US2 (assign type in creation row)
5. Complete Phase 5: US3 (select value on enum flag row)
6. Run T019 + T022 E2E tests to validate MVP
7. **STOP and demo**: All P1 stories work end-to-end

### Full Delivery (Add P2 Stories)

8. Complete Phase 6: US4 (edit enum type)
9. Complete Phase 7: US5 (delete enum type)
10. Complete Phase 8: All E2E tests
11. Complete Phase 9: Polish

---

## Task Count Summary

| Phase | Tasks | Notes |
|-------|-------|-------|
| Phase 1 — Setup | 3 | T001–T003 |
| Phase 2 — Foundational | 7 | T004–T009 (blocks all stories) |
| Phase 3 — US1 (P1) | 4 | T010–T013 |
| Phase 4 — US2 (P1) | 2 | T014–T015 |
| Phase 5 — US3 (P1) | 1 | T016 |
| Phase 6 — US4 (P2) | 2 | T016–T017 |
| Phase 7 — US5 (P2) | 1 | T018 |
| Phase 8 — E2E Tests | 5 | T019–T023 |
| Phase 9 — Polish | 3 | T024–T026 |
| **Total** | **28** | |

---

## Notes

- `[P]` tasks modify different files — they can be dispatched simultaneously to parallel agents
- Each user story phase produces a **working, testable increment** — stop at any checkpoint to validate
- The `UntypedFlag` concept is local to `FlagCreateRow` component state only — it never enters the store
- Confirm `@dnd-kit/helpers` provides the `move` function before T010; if the API differs, adapt the `onDragEnd` handler accordingly
- Enum flags cannot be parents (store guard + `useDroppable disabled` already enforces this for `type !== "boolean"`) — no extra work needed
