# Implementation Plan: Enum Flag Types

**Branch**: `004-enum-flag-types` | **Date**: 2026-02-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-enum-flag-types/spec.md`

---

## Summary

Extend the feature-flag system to support enum flags — flags whose value is one of a user-defined ordered list of strings. Users define enum types (name + unique values) exclusively via a searchable type picker popup. The type picker is reachable from the inline flag creation row ("+ Type") and from a new "Manage Types" button in the flag list toolbar. Enum type creation, editing (including sortable value reordering via drag-and-drop), and deletion (with cascade flag removal) are all done through a shadcn/ui Dialog modal. The inline creation row is redesigned to be type-aware: a Create button (and Enter key) is only enabled once both a flag name and a type are set.

All state is in-memory (Zustand). No backend changes. The implementation is contained entirely within the `feature-flags` feature module.

---

## Technical Context

**Language/Version**: TypeScript 5.x, strict mode, no `any`
**Primary Dependencies**: React 19.x, Zustand 5.x, @dnd-kit/react (existing), @dnd-kit/helpers (may need install), shadcn/ui (Dialog, Command, Popover, Select — check which are already installed), Lucide React (existing)
**Storage**: In-memory Zustand store only — no Prisma/SQLite changes
**Testing**: Vitest (unit tests for utilities), Playwright (E2E for critical user journeys)
**Target Platform**: Web — `apps/web` (Vite + React 19)
**Project Type**: Monorepo — frontend only (`apps/web`)
**Performance Goals**: All operations are in-memory; response must be instantaneous (no loading states needed)
**Constraints**: In-memory only; no network calls; no backend changes; no new Zustand store (extend existing)
**Scale/Scope**: Single user, local dev tool — no concurrency concerns

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

### Principle I — Composition Over Prop Drilling ✅ PASS

All new UI components (`TypePicker`, `EnumTypeModal`, `EnumValueList`) will use composition patterns. `TypePicker` accepts `onSelect` callbacks and renders children (Command items) rather than encoding configuration via booleans. `EnumTypeModal` wraps `EnumValueList` as a slot. The existing `FlagElement` / `FlagButton` compound component pattern is reused and extended, not modified with new props. No component in this feature will exceed 3 configuration props without being split into composable subcomponents.

### Principle II — Feature-Based Architecture ✅ PASS

All new code lives inside `apps/web/src/features/feature-flags/`. New enum-type components are placed under `components/enum-types/` within that feature. The only public export is `index.ts` — no external feature will import internal modules. There are no cross-feature imports introduced.

### Principle III — Type-Safe API Contract ✅ PASS (N/A for tRPC)

This feature adds no network communication. The "contract" is the Zustand store action interface, defined in TypeScript with strict mode. All store actions are typed with explicit parameter and return types. No `any` is used.

### Principle IV — State Isolation — Multiple Stores Pattern ✅ PASS

Enum type state (`enumTypes: EnumType[]`) is added to the **existing** `useFeatureFlagsStore`. A separate store is explicitly rejected (see `research.md §6`) because cascade delete logic requires co-location. No cross-store action calls are introduced. There is no server state in this feature, so TanStack Query is not involved.

### Principle V — Test Discipline ✅ PASS (requires action)

New utility functions (`validateEnumTypeName`, `validateEnumValues`, `getAffectedFlagCount`, `wouldRemoveUsedValue`) in `utils/enum-type.ts` **must** have Vitest unit tests in `utils/enum-type.test.ts`. The following Playwright E2E journeys are required:
- Full enum type create → assign to flag → change value flow
- Edit enum type: remove used value → confirm warning → verify flag reset
- Delete enum type: confirm cascade → verify flag removal
- Inline creation row: type selector gates the Create button; Enter key works

### Principle VI — Simplicity & YAGNI ✅ PASS

- `EnumValueList` (sortable rows) is extracted as a separate component because it is used in both the create and edit modal — satisfying the rule-of-three threshold.
- `TypePicker` is a single component with a `mode` prop ("assign" | "manage") to avoid duplication of the Command + Popover structure.
- No abstractions are introduced for hypothetical future types. The `FlagType` union (`"boolean" | "enum"`) is extended only as far as this feature requires.
- `UntypedFlag` is a local UI concept only — it is never stored in Zustand, keeping the store clean.

**Complexity Tracking**: No violations. No additional table entries required.

---

## Project Structure

### Documentation (this feature)

```text
specs/004-enum-flag-types/
├── plan.md              ← This file
├── research.md          ← Phase 0 output (complete)
├── data-model.md        ← Phase 1 output (complete)
├── quickstart.md        ← Phase 1 output (complete)
├── contracts/
│   └── store-actions.ts ← Phase 1 output (complete)
├── checklists/
│   └── requirements.md
└── tasks.md             ← Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code

```text
apps/web/src/features/feature-flags/
│
├── types/
│   └── index.ts                          MODIFY — discriminated union, EnumType, extended interfaces
│
├── store/
│   └── index.ts                          MODIFY — add enumTypes state + 4 new actions, update addFlag
│
├── utils/
│   ├── enum-type.ts                      CREATE — pure validation and query helpers
│   ├── enum-type.test.ts                 CREATE — Vitest unit tests
│   ├── flag-tree.ts                      CHECK  — confirm buildRenderList handles EnumFlag nodes
│   └── flag-tree.test.ts                 CHECK  — add cases for enum flag nodes if needed
│
├── components/
│   │
│   ├── enum-types/                       CREATE (new sub-folder)
│   │   ├── type-picker.tsx               CREATE — Command+Popover; modes: "assign" | "manage"
│   │   ├── enum-type-modal.tsx           CREATE — Dialog for create/edit; includes EnumValueList
│   │   └── enum-value-list.tsx           CREATE — scoped DragDropProvider + useSortable rows
│   │
│   └── flag-list/
│       ├── flag-create-row.tsx           MODIFY — local state for type selection; TypePicker integration;
│       │                                          Create button validation; Enter key; Escape/blur dismiss
│       ├── flag-row.tsx                  MODIFY — render EnumValueSelector for enum flags; guard toggle
│       └── flag-list.tsx                 MODIFY — "Manage Types" toolbar button
│
└── index.ts                              NO CHANGE — public API surface unchanged
```

**Structure Decision**: Web application (frontend only). Option 2 from the plan template, frontend subtree only. All changes are in `apps/web/src/features/feature-flags/`.

---

## Design Decisions

### TypePicker — Two Modes

```
mode="assign"   → triggered by "+ Type" on creation row
                → shows: Boolean chip + all enum types
                → bottom action: "Create new enum type…"
                → selecting an item calls onSelect(type, enumTypeId?)

mode="manage"   → triggered by "Manage Types" button in toolbar
                → shows: all enum types with edit (pencil) icon
                → bottom action: "Create new enum type…"
                → no onSelect (selection opens edit modal directly)
```

Both modes share the same `Command` + `Popover` structure and the same enum type list rendering. Grouping:
- Group 1 (assign mode only): "Primitive Types" → Boolean
- Group 2: "Enum Types" → list of user-defined types
- Bottom: "Create new enum type…" link

### EnumTypeModal — Create vs Edit

Same modal component, driven by an optional `enumType` prop:
- `enumType === undefined` → Create mode (empty name, empty values)
- `enumType !== undefined` → Edit mode (pre-filled name and values)

Delete action is only shown in Edit mode, as a destructive button in the modal footer.

### Confirmation Dialogs

Two distinct confirmation dialogs (using shadcn/ui `AlertDialog`):

1. **Remove used value** (inside EnumTypeModal during edit): "X flag(s) currently use the value 'Y'. Removing it will reset those flags to '[new default]'."
2. **Delete enum type** (EnumTypeModal footer): "X flag(s) use this type. Deleting it will also delete those flags."

Count is computed via `getAffectedFlagCount(enumTypeId)` and `getFlagsByEnumValue(enumTypeId, value)` before rendering.

### Inline Creation Row Redesign

```
[flag name input]  [+ Type | value control]  [Create ▶]
                                                ↑ disabled until name + type set
```

- Local state: `{ name, selectedType, selectedEnumTypeId }`
- "+ Type" element: click → opens TypePicker in "assign" mode
- After type selected: "+ Type" replaced with appropriate value preview
  - Boolean: "Boolean" label with toggle icon
  - Enum: enum type name + default value chip
- Escape key: dismiss creation row (no flag created)
- Click outside: dismiss creation row
- Enter (when `canCreate`): call `addFlag(...)` then dismiss

### Flag Row — Enum Value Selector

In `flag-row.tsx`, the boolean Switch is replaced with a shadcn/ui `Select` when `flag.type === "enum"`:

```
[flag name (draggable)]  [collapse?]  [Select: current value ▾]  [timestamps]  [menu]
```

The `Select` trigger shows the current value. The dropdown lists all values from the referenced `EnumType`. On change: calls `setEnumFlagValue(projectId, flag.id, newValue)`.

---

## Dependency & Risk Notes

- **`@dnd-kit/helpers`**: Confirm this package is installed (`pnpm list @dnd-kit/helpers`). If not, add it — it provides the `move` helper used in sortable enum value lists.
- **shadcn/ui components**: Confirm `Dialog`, `AlertDialog`, `Command`, `Popover`, `Select` are installed. Run `pnpm dlx shadcn@latest add dialog alert-dialog command popover select` for any missing ones.
- **`flag-tree.ts` compatibility**: `buildRenderList` and `hasDescendant` iterate over `AnyFlag[]`. After the type change, `EnumFlag` is a new variant — confirm the tree logic uses only `flag.parentId` (present on all variants) and does not assume `flag.type === "boolean"` for tree traversal. Adjust if needed.
- **`FlagTypeIcon`**: Currently only handles `"boolean"`. Add an enum icon case.
- **`toggleFlagValue` guard**: The store action already guards `f.type === "boolean"`. With the new discriminated union, TypeScript will enforce this more strictly — may require minor store action updates.
