# Data Model: Nested Flag Groups

**Feature**: 003-flag-groups | **Phase**: 1 | **Date**: 2026-02-19

## Entity: FeatureFlag (modified)

Adds `parentId` to the existing interface. All other fields are unchanged.

```
FeatureFlag<T extends FlagType>
├── id: string                  (UUID; unique within project; immutable)
├── name: string                (non-empty; mutable)
├── type: T                     ("boolean"; union with future types)
├── value: FlagValue<T>         (boolean for type "boolean")
├── parentId: string | null     (NEW) id of parent flag, or null for root-level flags
├── createdAt: Date             (immutable; set on creation)
└── updatedAt: Date             (updated on name change, type change, or value toggle)
```

### Validation Rules

- `parentId` MUST reference a valid flag `id` within the same project, or be `null`.
- A flag whose `parentId` references a non-existent flag MUST be treated as root-level (defensive — for eventual persistence).
- A flag can only have a parent flag whose `type === "boolean"`. This is enforced at assignment time.
- Circular parent references are FORBIDDEN. Before setting `parentId`, the store MUST verify the proposed parent is not a descendant of the current flag.
- A boolean flag that has at least one child MUST NOT have its `type` changed to a non-boolean type. The `updateFlag` action MUST reject such a change. The `FlagEditRow` UI MUST disable the type selector when the flag has children.

### State Transitions

```
Root Flag (parentId: null)
  ↓  setFlagParent(flagId, parentId)
Child Flag (parentId: string)
  ↓  detachFlag(flagId) or setFlagParent(flagId, null)
Root Flag (parentId: null)

Parent Flag deleted:
  Direct children → parentId: null (promoted to root)
  Grandchildren → parentId unchanged (remain children of now-promoted parent)
```

---

## Entity: FlagGroup (derived, no separate storage)

A FlagGroup is not a stored entity. It is a view derived from the flat flags array:

```
FlagGroup (derived)
├── parent: FeatureFlag<"boolean">         root flag of the group
└── children: FeatureFlag[]               all flags where parentId === parent.id
```

Built by `buildFlagTree()` in `utils/flag-tree.ts`.

---

## Entity: FlagRenderNode (view model, in-memory only)

Used by `flag-list.tsx` to render the ordered list. Produced by `buildRenderList()` in `utils/flag-tree.ts`.

```
FlagRenderNode
├── flag: AnyFlag                 the flag to render
├── depth: number                 nesting level (0 = root, 1 = direct child, …)
├── isLastChild: boolean          true if this is the last child of its parent
├── hasChildren: boolean          true if this flag has ≥1 child in the current project
└── ancestorIsLastChild: boolean[] per-level "is last child" for ancestor connector rendering
```

---

## Zustand Store State (modified)

```
FeatureFlagsState (modified)
├── projects: Project[]                     (unchanged)
├── selectedProjectId: string               (unchanged)
├── flags: Record<string, AnyFlag[]>        (unchanged shape; AnyFlag gains parentId)
├── sidebarOpen: boolean                    (unchanged)
└── collapsedFlagIds: Set<string>           (NEW) IDs of parent flags currently collapsed
```

### Invariants

- A flag ID in `collapsedFlagIds` that no longer exists in any project MUST be silently ignored during rendering.
- `collapsedFlagIds` is not project-scoped (IDs are UUIDs; globally unique across projects).

---

## Seed Data (updated)

Existing seed flags gain `parentId: null` to satisfy the updated interface. No new seed groups are defined (added by user at runtime).

```
SEED_FLAGS = {
  "proj-1": [
    { id: "flag-1", name: "dark-mode",     type: "boolean", value: true,  parentId: null, … },
    { id: "flag-2", name: "new-checkout",  type: "boolean", value: false, parentId: null, … },
  ],
  "proj-2": [
    { id: "flag-3", name: "beta-dashboard", type: "boolean", value: false, parentId: null, … },
  ]
}
```
