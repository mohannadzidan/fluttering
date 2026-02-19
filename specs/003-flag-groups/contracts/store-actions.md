# Store Action Contracts: Nested Flag Groups

**Feature**: 003-flag-groups | **Phase**: 1 | **Date**: 2026-02-19

This feature has no network communication. The Zustand store actions serve as the internal typed contract between the UI and the state layer.

---

## New Dependency

```
@dnd-kit/react        # DndContext, useDraggable, useDroppable, DragEndEvent
@dnd-kit/utilities   # CSS.Transform utility
```

Install: `pnpm --filter web add @dnd-kit/react @dnd-kit/utilities`

---

## Modified Actions

### `addFlag(projectId, name, type)`

**Change**: New flags are created with `parentId: null` by default.

```
addFlag(projectId: string, name: string, type: FlagType): void

Creates a new root-level flag.
- parentId defaults to null
- id: crypto.randomUUID()
- value: false (for boolean)
- createdAt / updatedAt: now
```

### `updateFlag(projectId, flagId, patch)`

**Change**: Gains a type-change guard. If the flag currently has `type === "boolean"`, the patch requests a different type, and the flag has at least one child, the update is rejected (no mutation). The UI MUST disable the type selector in `FlagEditRow` for flags with children to provide pre-emptive feedback.

```
updateFlag(
  projectId: string,
  flagId: string,
  patch: { name?: string; type?: FlagType }
): void

Guard (reject without mutation if violated):
  - patch.type is defined AND patch.type !== current flag.type
  - AND current flag.type === "boolean"
  - AND getDirectChildren(flags[projectId], flagId).length > 0

Mutation (when guard passes):
  - Apply patch fields to flag
  - flag.updatedAt = now
```

### `deleteFlag(projectId, flagId)`

**Change**: Before removing the flag, all flags in `flags[projectId]` whose `parentId === flagId` have their `parentId` set to `null` (promoted to root). Removes the flagId from `collapsedFlagIds` if present.

```
deleteFlag(projectId: string, flagId: string): void

1. For each flag in flags[projectId] where flag.parentId === flagId:
     flag.parentId = null
2. Remove flagId from flags[projectId] array
3. Remove flagId from collapsedFlagIds
```

---

## New Actions

### `setFlagParent(projectId, flagId, parentId)`

Assigns or reassigns the parent of a flag. Pass `null` as `parentId` to detach (promote to root).

```
setFlagParent(
  projectId: string,
  flagId: string,
  parentId: string | null
): void

Pre-conditions (guard — return without mutation if violated):
  - flagId exists in flags[projectId]
  - parentId is null OR:
      - parentId exists in flags[projectId]
      - flags[projectId].find(f => f.id === parentId).type === "boolean"
      - parentId does not create a cycle (parentId is not a descendant of flagId)

Mutation:
  - flags[projectId] → update flag.parentId = parentId
  - flag.updatedAt = now
```

**Cycle detection algorithm** (O(depth)):

```
isCyclic(flags, flagId, proposedParentId):
  cursor = proposedParentId
  while cursor !== null:
    if cursor === flagId → return true (cycle detected)
    cursor = flags.find(f => f.id === cursor)?.parentId ?? null
  return false
```

### `toggleFlagCollapsed(flagId)`

Toggles the collapsed/expanded state of a parent flag.

```
toggleFlagCollapsed(flagId: string): void

If flagId is in collapsedFlagIds → remove it (expand)
If flagId is not in collapsedFlagIds → add it (collapse)
```

---

## New Utility Functions (`utils/flag-tree.ts`)

These are pure functions with no side effects. All MUST have Vitest unit tests.

### `buildRenderList(flags, collapsedFlagIds)`

Converts the flat flags array into an ordered array of `FlagRenderNode` objects for rendering.

```
buildRenderList(
  flags: AnyFlag[],
  collapsedFlagIds: Set<string>
): FlagRenderNode[]

Algorithm:
  1. Build adjacency map: children = Map<parentId | null, AnyFlag[]>
  2. Walk root flags (parentId === null) in original array order
  3. For each flag, recursively append children in order
  4. Skip appending children if flagId is in collapsedFlagIds
  5. Track depth, isLastChild, hasChildren, ancestorIsLastChild per node

Returns: flat ordered array of FlagRenderNode
```

### `hasDescendant(flags, ancestorId, targetId)`

Returns `true` if `targetId` is a descendant of `ancestorId` at any depth.

```
hasDescendant(flags: AnyFlag[], ancestorId: string, targetId: string): boolean
```

### `getDirectChildren(flags, parentId)`

Returns all flags whose `parentId === parentId`.

```
getDirectChildren(flags: AnyFlag[], parentId: string): AnyFlag[]
```

---

## UI Component Interface Changes

### `FlagRow` props (modified)

```typescript
interface FlagRowProps {
  flag: AnyFlag;
  projectId: string;
  depth: number;                  // NEW: 0 = root, 1 = direct child, etc.
  hasChildren: boolean;           // NEW: true → show collapse toggle
  isLastChild: boolean;           // NEW: drives connector variant
  ancestorIsLastChild: boolean[]; // NEW: per-level "is last" for ancestor lines
  isCollapsed: boolean;           // NEW: collapse toggle current state
  onEdit: () => void;
  onDelete: () => void;
  onAddChild: () => void;         // NEW: triggers inline create below this flag
  onDetach: () => void;           // NEW: removes this flag from its parent
  onToggleCollapse: () => void;   // NEW: toggles collapse state
}
```

**Collapse toggle placement**: Rendered as a `FlagElementContainer` immediately after the name `FlagElementContainer`. Visible only when `hasChildren === true`.

**Row layout order**:
```
[Name Container] [Collapse Toggle Container (if hasChildren)] [flex-1] [Value Toggle] [Created] [Updated] [Menu]
```

### `FlagConnector` props (new component)

```typescript
interface FlagConnectorProps {
  depth: number;                  // current node depth (≥1)
  isLastChild: boolean;           // determines connector shape
  ancestorIsLastChild: boolean[]; // determines which ancestor lines to draw
}
```

Renders absolutely-positioned dashed CSS elbow connectors. Uses Tailwind `border-l`, `border-b`, `border-dashed` classes.

### `FlagCreateRow` props (modified)

```typescript
// Added prop:
parentId?: string | null;  // If provided, new flag is created with this parentId
```

### `FlagMoveToMenu` props (new component)

A searchable dropdown listing all eligible boolean parent flags in the current project (excluding the flag itself and its descendants).

```typescript
interface FlagMoveToMenuProps {
  flag: AnyFlag;
  projectId: string;
  candidates: AnyFlag[];   // pre-filtered: boolean flags, not self, not descendants
  onSelect: (parentId: string) => void;
}
```

Rendered as a submenu or popover triggered from `FlagMenu`. Uses shadcn/ui `Popover` + `Command` (combobox pattern) for search.

### `FlagRow` drag-and-drop integration

```typescript
// Inside FlagRow:
const { attributes, listeners, setNodeRef: setDragRef, transform } =
  useDraggable({ id: flag.id });

const { setNodeRef: setDropRef, isOver } =
  useDroppable({ id: flag.id, disabled: flag.type !== "boolean" });

// Merge refs on the row container.
// Apply CSS.Transform.toString(transform) via inline style only when transform is non-null
// (dynamic value — Tailwind cannot express runtime transforms).
```

### `FlagList` DnD wiring

```typescript
// FlagList wraps rendered rows in:
<DndContext onDragEnd={handleDragEnd}>
  {renderList.map(node => <FlagRow key={node.flag.id} ... />)}
</DndContext>

handleDragEnd(event: DragEndEvent):
  const { active, over } = event
  if (!over || active.id === over.id) return
  const draggedFlag = flags.find(f => f.id === active.id)
  const targetFlag  = flags.find(f => f.id === over.id)
  if (!targetFlag || targetFlag.type !== "boolean") return
  setFlagParent(projectId, active.id as string, over.id as string)
```

### `FlagMenu` items (modified)

```
Existing:
  - Edit
  - Delete (destructive)

New items:
  - Add child flag (boolean flags only) → calls onAddChild
  - Move to…        (all flags)         → opens FlagMoveToMenu picker
  - Detach from parent (only when flag.parentId !== null) → calls onDetach
```

### `FlagRow` updated props

```typescript
interface FlagRowProps {
  flag: AnyFlag;
  projectId: string;
  depth: number;
  hasChildren: boolean;
  isLastChild: boolean;
  ancestorIsLastChild: boolean[];
  isCollapsed: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild: () => void;
  onDetach: () => void;
  onToggleCollapse: () => void;
  onMoveTo: (parentId: string) => void;   // NEW: called by FlagMoveToMenu on select
}
```
