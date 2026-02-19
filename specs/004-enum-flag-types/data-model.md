# Data Model: Enum Flag Types (004)

**Phase**: 1 — Design
**Date**: 2026-02-19
**Branch**: `004-enum-flag-types`

---

## Entity Overview

This feature extends the existing flag data model with two additions:

1. **EnumType** — a new global entity defining a named, ordered set of unique string values
2. **EnumFlag** — a new concrete flag variant (alongside the existing `BooleanFlag`)
3. **UntypedFlag** — a new ephemeral flag variant that exists only in UI local state during inline creation (never persisted to the Zustand store)

---

## EnumType

Represents a user-defined type that can be assigned to flags.

```typescript
interface EnumType {
  id: string;        // UUID, generated at creation
  name: string;      // Display name; unique (case-insensitive comparison)
  values: string[];  // Ordered list; case-sensitive unique; length >= 1
                     // values[0] is always the default value
}
```

**Constraints:**
- `name` uniqueness is enforced case-insensitively at the store level (e.g., "Status" and "status" are the same)
- `values` items are unique within the array using case-sensitive comparison
- `values.length >= 1` at all times — enforced in UI and as a store guard
- `values[0]` is the implicit default value; no separate `defaultValue` field is needed

**Relationships:**
- An `EnumType` is referenced by zero or more `EnumFlag`s via `enumTypeId`
- Deleting an `EnumType` cascades: all `EnumFlag`s with a matching `enumTypeId` are deleted from all projects
- Removing a value from `values` resets all `EnumFlag`s holding that value to `values[0]`

---

## Flag Variants (Discriminated Union)

All three variants share a common base shape.

```typescript
// Common base fields (not a standalone interface — shared across variants)
// id: string        — UUID
// name: string      — display name
// parentId: string | null  — hierarchy parent (must be a BooleanFlag if set)
// createdAt: Date
// updatedAt: Date

interface UntypedFlag {
  // Ephemeral — exists only in FlagCreateRow local state, never in the store
  id: string;
  name: string;
  type: "untyped";
  value: null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface BooleanFlag {
  // Existing — no structural change
  id: string;
  name: string;
  type: "boolean";
  value: boolean;          // default: false
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EnumFlag {
  // New
  id: string;
  name: string;
  type: "enum";
  enumTypeId: string;      // references EnumType.id
  value: string;           // must be in EnumType.values; initialized to values[0]
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type AnyFlag = BooleanFlag | EnumFlag;
// UntypedFlag is excluded from AnyFlag — it only exists in local component state
```

**Type narrowing pattern** (used in store actions and components):
```typescript
switch (flag.type) {
  case "boolean": /* flag is BooleanFlag */ break;
  case "enum":    /* flag is EnumFlag    */ break;
}
```

---

## Store State Extension

The existing `FeatureFlagsState` is extended with one new field:

```typescript
interface FeatureFlagsState {
  // --- Existing (unchanged) ---
  projects: Project[];
  selectedProjectId: string;
  flags: Record<string, AnyFlag[]>;  // keyed by projectId; AnyFlag now includes EnumFlag
  sidebarOpen: boolean;
  collapsedFlagIds: Set<string>;

  // --- New ---
  enumTypes: EnumType[];             // global enum type registry (not per-project)
}
```

---

## Store Actions Extension

New actions added to `FeatureFlagsStore`:

```typescript
interface EnumTypeActions {
  // Create a new enum type. Enforces name uniqueness (case-insensitive) and min-1 value.
  createEnumType: (name: string, values: string[]) => void;

  // Replace an enum type's name and/or values.
  // After update, any EnumFlag whose current value is no longer in values[]
  // is automatically reset to values[0].
  // Enforces min-1 value and name uniqueness (excluding self).
  updateEnumType: (id: string, name: string, values: string[]) => void;

  // Delete an enum type and all EnumFlags referencing it across all projects.
  deleteEnumType: (id: string) => void;
}

interface EnumFlagActions {
  // Set the current value of an EnumFlag.
  // No-op if value is not in the flag's EnumType.values.
  setEnumFlagValue: (projectId: string, flagId: string, value: string) => void;
}
```

**Modified existing action** — `addFlag` is extended to accept `enumTypeId`:

```typescript
// Before:
addFlag: (projectId: string, name: string, type: FlagType, parentId?: string | null) => void;

// After:
addFlag: (
  projectId: string,
  name: string,
  type: "boolean" | "enum",
  parentId?: string | null,
  enumTypeId?: string         // required when type === "enum"
) => void;
```

---

## Cascade Behavior Summary

| Event | Effect on Flags |
|-------|-----------------|
| `deleteEnumType(id)` | All `EnumFlag`s with `enumTypeId === id` are deleted from all projects |
| `updateEnumType(id, name, values)` where a value is removed | All `EnumFlag`s with `enumTypeId === id` whose `value` is not in new `values` are reset to `values[0]` |
| `updateEnumType(id, name, values)` where values are reordered | `EnumFlag`s are unaffected; only the implicit default (`values[0]`) changes going forward |
| `deleteFlag` on a `BooleanFlag` with children | Children are promoted to root (existing behavior, unchanged) |
| `deleteFlag` on an `EnumFlag` | Flag is removed; no children (enum flags cannot be parents) |

---

## Flags That Cannot Be Parents

Only `BooleanFlag`s may have children (`parentId` pointing to them). `EnumFlag`s are always leaf nodes. This is enforced in:
- The `setFlagParent` store action (existing guard: target must be `type === "boolean"`)
- The `useDroppable` hook (`disabled: flag.type !== "boolean"`)

No changes needed to this guard — `type === "boolean"` still correctly excludes enum flags.

---

## Local UI State (FlagCreateRow)

The inline creation row manages its own local state, never written to the store until "Create" is confirmed:

```typescript
// Local state in FlagCreateRow component
interface CreateRowState {
  name: string;
  selectedType: "boolean" | "enum" | null;  // null = untyped (no type chosen yet)
  selectedEnumTypeId: string | null;         // set when selectedType === "enum"
}

// Derived: is the Create button enabled?
const canCreate = name.trim().length > 0 && selectedType !== null;
```
