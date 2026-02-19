# Developer Quickstart: Enum Flag Types (004)

**Branch**: `004-enum-flag-types`
**Date**: 2026-02-19

---

## What This Feature Adds

1. **Enum types** — user-defined named sets of string values, managed via the type picker modal
2. **Typed flag creation** — the inline creation row gains a "+ Type" selector before the Create button is enabled
3. **Enum flag value control** — enum flags show a dropdown selector instead of a boolean Switch
4. **"Manage Types" entry point** — a button in the flag list toolbar opens the type picker in manage mode

---

## Key Files to Modify / Create

### Types & Store (touch first — everything depends on these)

| File | Change |
|------|--------|
| `apps/web/src/features/feature-flags/types/index.ts` | Replace `FeatureFlag<T>` generic with discriminated union; add `EnumType`; extend state/action interfaces |
| `apps/web/src/features/feature-flags/store/index.ts` | Add `enumTypes: []` to initial state; implement `createEnumType`, `updateEnumType`, `deleteEnumType`, `setEnumFlagValue`; update `addFlag` signature |

### New Components

| File | Purpose |
|------|---------|
| `apps/web/src/features/feature-flags/components/enum-types/type-picker.tsx` | Searchable `Command` popover listing Boolean + all enum types; "Create new…" option; edit icon per enum type |
| `apps/web/src/features/feature-flags/components/enum-types/enum-type-modal.tsx` | `Dialog` for create/edit — name field, sortable value list, save/cancel |
| `apps/web/src/features/feature-flags/components/enum-types/enum-value-list.tsx` | Sortable list of enum values within the modal, using `@dnd-kit/react` `useSortable` + `move` from `@dnd-kit/helpers` |

### Modified Components

| File | Change |
|------|--------|
| `apps/web/src/features/feature-flags/components/flag-list/flag-create-row.tsx` | Add local state for `selectedType` + `selectedEnumTypeId`; render `TypePicker`; render `EnumValueSelector` when enum selected; enable Create button only when `name && selectedType` |
| `apps/web/src/features/feature-flags/components/flag-list/flag-row.tsx` | Render `EnumValueSelector` for `flag.type === "enum"` instead of Switch; guard toggle action to boolean flags only |
| `apps/web/src/features/feature-flags/components/flag-list/flag-list.tsx` | Add "Manage Types" button to toolbar; wire to open `TypePicker` in manage mode |

### New Utilities + Tests

| File | Purpose |
|------|---------|
| `apps/web/src/features/feature-flags/utils/enum-type.ts` | Pure functions: `validateEnumTypeName`, `validateEnumValues`, `getAffectedFlagCount`, `wouldRemoveUsedValue` |
| `apps/web/src/features/feature-flags/utils/enum-type.test.ts` | Vitest unit tests for all utility functions |

---

## Execution Order

Follow this order to avoid type errors cascading across files:

```
1. types/index.ts          — Update discriminated union, add EnumType, extend interfaces
2. store/index.ts          — Implement new actions and state
3. utils/enum-type.ts      — Pure helpers (used by components and store)
4. utils/enum-type.test.ts — Tests for helpers
5. enum-value-list.tsx     — Sortable value rows (no store deps, standalone)
6. enum-type-modal.tsx     — Depends on enum-value-list + store actions
7. type-picker.tsx         — Depends on enum-type-modal + store state
8. flag-create-row.tsx     — Depends on type-picker
9. flag-row.tsx            — Update value control for enum flags
10. flag-list.tsx          — Add "Manage Types" button
```

---

## DnD Setup for Sortable Enum Values

The enum type modal uses drag-and-drop to reorder values. The existing `DragDropProvider` (wrapping the flag list) must **not** be used — a separate, scoped provider wraps only the enum value list inside the modal.

```typescript
// enum-value-list.tsx — simplified pattern
import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { useSortable } from "@dnd-kit/react";

function EnumValueList({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;
        onChange(move(values, event));
      }}
    >
      {values.map((value, index) => (
        <SortableValueRow key={value} id={value} index={index} value={value} />
      ))}
    </DragDropProvider>
  );
}
```

---

## Type Picker — Two Modes

The `TypePicker` component operates in two modes controlled by a `mode` prop:

| Mode | Trigger | Behaviour |
|------|---------|-----------|
| `"assign"` | Click "+ Type" on creation row | Shows Boolean + enum types; selecting one calls `onSelect(type, enumTypeId?)` |
| `"manage"` | "Manage Types" button in toolbar | Shows enum types only with edit icons; no selection callback; used for CRUD |

Both modes share the same underlying `Command` + `Popover` structure. "Create new enum type…" appears at the bottom in both modes.

---

## Store Action Invocation Examples

```typescript
// Create an enum type
createEnumType("Environment", ["production", "staging", "development"]);
// → enumTypes gains: { id: uuid, name: "Environment", values: ["production", "staging", "development"] }

// Add an enum flag (from FlagCreateRow on Create)
addFlag(projectId, "deploy-target", "enum", null, enumTypeId);
// → flags[projectId] gains EnumFlag with value: enumType.values[0]

// Change an enum flag's value
setEnumFlagValue(projectId, flagId, "staging");

// Update enum type — removes "development", resets affected flags
updateEnumType(id, "Environment", ["production", "staging"]);
// → Any EnumFlag with value === "development" is reset to "production"

// Delete enum type — also deletes all EnumFlags referencing it
deleteEnumType(id);
// → enumTypes and all matching flags removed
```

---

## Testing Checklist

### Vitest (unit — `utils/enum-type.test.ts`)
- [ ] `validateEnumTypeName`: rejects empty, rejects duplicate name (case-insensitive), accepts valid
- [ ] `validateEnumValues`: rejects empty array, rejects duplicates (case-sensitive), accepts valid
- [ ] `getAffectedFlagCount(enumTypeId)`: returns correct count of flags referencing the type
- [ ] `wouldRemoveUsedValue(enumTypeId, removedValue)`: correctly identifies if any flag holds `removedValue`

### Playwright (E2E — critical user journeys)
- [ ] Create an enum type via the type picker and assign it to a new flag
- [ ] Enum flag row shows value selector; selecting a value persists it
- [ ] Edit an enum type: remove a used value, confirm warning, verify flag reset to default
- [ ] Delete an enum type with N flags: confirm warning shows count N, verify deletion cascade
- [ ] "Manage Types" button opens picker in manage mode; create/edit/delete all work
- [ ] Inline creation row: Create button disabled until both name and type are set; Enter key works
- [ ] Escape and click-outside dismiss the creation row without creating a flag
