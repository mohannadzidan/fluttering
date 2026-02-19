# Data Model: Feature Flags Management UI

**Branch**: `002-feature-flags` | **Phase**: 1 | **Date**: 2026-02-19

> This feature is UI-only with no backend or database. All state lives in a single Zustand
> store in `apps/web/src/features/feature-flags/store/`. There is no persistence — state resets
> on page refresh.

---

## Entities

### FlagType

An extensible union type enumerating supported flag value kinds. Currently only `boolean` is
implemented; the discriminated union pattern allows future types to be added cleanly.

```
FlagType = "boolean"   (only implemented type)
         | "string"    (future)
         | "number"    (future)
         | "json"      (future)
```

**Design constraint**: Every new type added to `FlagType` must also:
1. Add a corresponding `FlagValue` mapping in the type-safe value lookup.
2. Add a corresponding Lucide icon in `FlagTypeIcon`.
3. Add a corresponding value-control component (e.g., a text input for `string`).

---

### FeatureFlag

The core entity. A named configuration toggle belonging to a project.

| Field       | Type             | Required | Notes                                          |
|-------------|------------------|----------|------------------------------------------------|
| `id`        | `string` (UUID)  | Yes      | Generated with `crypto.randomUUID()` on create |
| `name`      | `string`         | Yes      | Display name; non-empty; not unique per project |
| `type`      | `FlagType`       | Yes      | Discriminates the `value` field's type          |
| `value`     | `boolean` (now)  | Yes      | `false` by default on creation                  |
| `createdAt` | `Date`           | Yes      | Set to `new Date()` on creation; never changed  |
| `updatedAt` | `Date`           | Yes      | Set to `new Date()` on creation; refreshed on any edit or toggle |

**Discriminated union shape** (future-proof):

```
BooleanFlag  = { id, name, type: "boolean", value: boolean, createdAt, updatedAt }
StringFlag   = { id, name, type: "string",  value: string,  createdAt, updatedAt }  (future)
NumberFlag   = { id, name, type: "number",  value: number,  createdAt, updatedAt }  (future)
```

**Validation rules**:
- `name` MUST be a non-empty string (trimmed). Leading/trailing whitespace is stripped on save.
- `name` MAY be duplicated within a project (no uniqueness constraint).
- `value` defaults to `false` for `boolean` type on creation.
- `createdAt` is set once on creation and is immutable.
- `updatedAt` is refreshed on every `updateFlag` and `toggleFlagValue` action.

---

### Project

A named container that groups a set of feature flags.

| Field  | Type            | Required | Notes                                             |
|--------|-----------------|----------|---------------------------------------------------|
| `id`   | `string` (UUID) | Yes      | Static — seeded in-memory at startup              |
| `name` | `string`        | Yes      | Display name shown in the project selector        |

**Constraints**:
- Projects are predefined in the initial store seed. Project CRUD is out of scope.
- At least one project must exist at startup; the first project is auto-selected.

---

## Store Structure

### State Shape

```
FeatureFlagsState {
  projects:          Project[]                     // Ordered list of available projects
  selectedProjectId: string                        // ID of the currently selected project
  flags:             Record<string, FeatureFlag[]> // projectId → ordered list of flags
  sidebarOpen:       boolean                       // true = expanded, false = collapsed
}
```

### Actions

| Action             | Signature                                                              | Side Effects                        |
|--------------------|------------------------------------------------------------------------|-------------------------------------|
| `selectProject`    | `(projectId: string) => void`                                          | Updates `selectedProjectId`         |
| `setSidebarOpen`   | `(open: boolean) => void`                                              | Toggles `sidebarOpen`               |
| `addFlag`          | `(projectId, name, type) => void`                                      | Appends new flag; sets timestamps   |
| `updateFlag`       | `(projectId, flagId, { name?, type? }) => void`                        | Updates fields; refreshes `updatedAt` |
| `toggleFlagValue`  | `(projectId, flagId) => void`                                          | Flips boolean value; refreshes `updatedAt` |
| `deleteFlag`       | `(projectId, flagId) => void`                                          | Removes flag from array             |

### Initial Seed Data

The store is initialized with two sample projects and two sample boolean flags per project
to enable immediate demonstration without creating flags manually.

```
Projects (seeded):
  { id: "proj-1", name: "Production" }
  { id: "proj-2", name: "Staging" }

Flags for proj-1 (seeded):
  { id: "flag-1", name: "dark-mode", type: "boolean", value: true, ... }
  { id: "flag-2", name: "new-checkout", type: "boolean", value: false, ... }

Flags for proj-2 (seeded):
  { id: "flag-3", name: "beta-dashboard", type: "boolean", value: false, ... }
```

---

## State Transitions

### Flag Lifecycle

```
[No flag]
    │
    │  addFlag(projectId, name, type)
    ▼
[FeatureFlag created]
  value = false (boolean default)
  createdAt = now()
  updatedAt = now()
    │
    ├──────────────────────────────────────────┐
    │  toggleFlagValue()                        │  updateFlag({ name, type })
    ▼                                          ▼
[Value updated]                        [Metadata updated]
  value = !value                         name or type changed
  updatedAt = now()                      updatedAt = now()
    │                                          │
    └──────────────────────────────────────────┘
                        │
                        │  deleteFlag()
                        ▼
                   [Flag removed]
```

### Sidebar Toggle

```
sidebarOpen: true  ──[setSidebarOpen(false)]──▶  sidebarOpen: false
sidebarOpen: false ──[setSidebarOpen(true)]───▶  sidebarOpen: true
```

---

## Extensibility Notes

When adding a new `FlagType` (e.g., `"string"`):

1. **types/index.ts**: Add `"string"` to the `FlagType` union; add `StringFlag` interface;
   update `FlagValue<T>` conditional type.
2. **store/index.ts**: The `addFlag` action uses the `type` parameter to set the default value.
   Add a `defaultValueFor(type)` helper that returns the appropriate default (e.g., `""` for string).
3. **components/flag-type-icon.tsx**: Add a `case "string"` with the `Quote` Lucide icon.
4. **components/flag-list/flag-row.tsx**: Add a `case "string"` that renders an inline text
   input instead of a Switch.
5. No store shape changes needed — the `flags` record already holds `FeatureFlag[]` (the union type).
