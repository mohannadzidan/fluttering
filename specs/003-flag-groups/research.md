# Research: Nested Flag Groups

**Feature**: 003-flag-groups | **Phase**: 0 | **Date**: 2026-02-19

## Decision 1: Flat Array vs. Nested Object Tree for Storage

- **Decision**: Keep flags as a flat array in the Zustand store; add `parentId: string | null` to each flag.
- **Rationale**: The existing store uses `Record<projectId, AnyFlag[]>`. Changing to a nested tree would require recursive store updates and break all existing consumers. A flat array with `parentId` is trivially queryable (filter by parentId to find children), avoids deep mutation, and is the standard approach for hierarchical data in flat stores (used by virtually every UI tree library and file-system models). Deriving the tree from the flat list is a pure computation that naturally belongs in a utility function.
- **Alternatives considered**:
  - Nested `children: AnyFlag[]` embedded in each flag — rejected because Zustand immutable updates become O(depth) recursive rewrites and the store's existing `flags[projectId]` shape would require a breaking change.
  - Separate `flagRelations: Record<parentId, childId[]>` map — rejected as unnecessary complexity for a single scalar field.

## Decision 2: CSS Elbow Connectors vs. SVG/Canvas

- **Decision**: Pure CSS dashed elbow connectors using Tailwind utility classes and conditional class application.
- **Rationale**: The connector is a decorative layout element, not interactive. CSS borders (dashed) applied to absolutely-positioned divs can precisely reproduce the described elbow shape (vertical segment + horizontal turn). Tailwind v4 supports `border-dashed`, `border-l`, `border-b` and `absolute` positioning. No SVG coordinate math is needed. SVG or Canvas would introduce a dependency and require runtime dimension measurements; CSS intrinsically follows the DOM layout.
- **Implementation pattern**:
  - Each child row at depth > 0 receives an absolutely-positioned `FlagConnector` component rendered to its left.
  - The connector renders two segments: a vertical dashed `border-l` segment and a horizontal dashed `border-b` segment forming an L-shape.
  - For non-last children, only the vertical segment extends past the horizontal branch (the vertical line continues to connect to subsequent siblings). For the last child, the vertical segment is clipped at the branch point.
  - Ancestor vertical lines (for deeper nesting levels) are rendered as thin dashed `border-l` divs absolutely positioned at each ancestor's indent column.
- **Alternatives considered**:
  - SVG `<line>` elements — rejected because they require reading DOM measurements to span between rows, making them fragile to layout changes.
  - CSS `::before` / `::after` pseudo-elements — viable but less composable and harder to manage with Tailwind; explicit React components give better control and testability.

## Decision 3: Collapse State Storage Location

- **Decision**: `collapsedFlagIds: Set<string>` stored in the feature Zustand store (`store/index.ts`).
- **Rationale**: Collapse state is UI state scoped to this feature and must survive re-renders and list redraws. It is not server state (TanStack Query) and not ephemeral (not `useState` in a component). The existing feature store already owns `sidebarOpen` as a comparable boolean UI state. A `Set<string>` is the correct structure: O(1) lookup, naturally deduplicated, semantically expresses "which IDs are collapsed". Serialization is handled by storing as an array in the Zustand initial state (a `Set` is reconstructed on hydration if persistence is added later).
- **Alternatives considered**:
  - `Record<string, boolean>` — functionally equivalent, slightly more verbose for lookups; `Set` is more semantically correct.
  - `useState` inside `FlagList` — rejected because collapse state would reset on parent re-mount and is semantically part of the feature's view state, not ephemeral component state.

## Decision 4: Tree Rendering Strategy in `flag-list.tsx`

- **Decision**: Build a flat ordered array of `{ flag, depth, isLastChild }` tuples from the flat flags array (using a utility in `utils/flag-tree.ts`), then map that array to rows. Filter out collapsed subtrees during the build.
- **Rationale**: React renders a flat list of JSX elements (not a nested component tree that matches the data tree). Converting the data tree to an ordered, flat rendering list with metadata (`depth`, `isLastChild`) allows `flag-list.tsx` to remain a simple `array.map()` render, consistent with the existing pattern. The `isLastChild` metadata drives which connector variant to render. The entire tree→render-list derivation is a pure function, easily unit-tested with Vitest.
- **Alternatives considered**:
  - Recursive component rendering — rejected because it makes `key` management complex, makes collapse state harder to apply without prop-drilling, and is harder to test. A flat render list is the standard approach used by headless tree libraries (TanStack Virtual, react-arborist, etc.).
  - Memoized selector computing the render list — viable enhancement in a later phase; not needed for correctness in Phase 1.

## Decision 5: Collapse Toggle Placement in FlagRow

- **Decision** (per user requirement): The collapse/expand toggle is rendered as a `FlagElementContainer` placed **immediately after the name container** in the FlagRow layout. It is only rendered when `hasChildren` is true.
- **Rationale**: Placing the toggle directly adjacent to the flag name makes the parent-child relationship visually obvious. Using `FlagElementContainer` keeps the layout consistent with all other row elements (toggle switch, timestamps, menu). The Lucide `ChevronDown` / `ChevronRight` icons communicate expanded/collapsed state clearly without additional labels.
- **Row layout order**: `[Name] [Collapse Toggle (if parent)] [flex-1 spacer] [Value Toggle] [Created] [Updated] [Menu]`

## Decision 6: Parent Eligibility

- **Decision**: Only `boolean` flags are eligible as parents. Validation occurs in the store action (`setFlagParent`) and is enforced in the UI (menu option disabled/hidden for non-boolean flags).
- **Rationale**: This matches FR-001. Boolean flags represent feature on/off switches, where the semantic of "this group of related flags is active when this parent is on" is natural. Other flag types (string, number) do not carry an obvious enabling semantics. A single check `flag.type === 'boolean'` is sufficient.

## Decision 7: Child Orphan Promotion on Parent Deletion

- **Decision**: `deleteFlag` is updated to find all direct children of the deleted flag and set their `parentId` to `null`, promoting them to root level. Grandchildren follow their immediate parents automatically (if parent is promoted to root, grandchildren remain children of the promoted flag).
- **Rationale**: FR-009 requires promotion. The simplest correct implementation: on delete, a single pass through the flat flags array updates all flags whose `parentId === deletedFlagId` to `parentId = null`. Grandchildren are unaffected because their parentId references the intermediate parent, not the deleted root parent.

## Decision 8: Drag-and-Drop Library for Reparenting

- **Decision**: `@dnd-kit/core` + `@dnd-kit/utilities` (new dependency).
- **Rationale**: No DnD library exists in the project. `@dnd-kit/core` is the recommended choice for React 19: it is framework-agnostic at the core, ships with zero deprecated lifecycle APIs, supports pointer and touch events natively, has no peer-dependency conflicts with React 19, and is the lightest complete DnD solution (~10 kB gzipped). The `useDraggable` and `useDroppable` hooks compose cleanly with existing row components without requiring a tree restructure. Drop targets can be scoped to boolean flags only via the hook's `disabled` prop.
- **Integration pattern**:
  - `FlagList` wraps the flag list in a `<DndContext onDragEnd={...}>`.
  - Each `FlagRow` uses `useDraggable({ id: flag.id })` to make the row draggable.
  - Each `FlagRow` (for boolean flags) uses `useDroppable({ id: flag.id, disabled: !isBooleanFlag })` to accept drops.
  - On `DragEnd`, if `over.id !== active.id` and the drop target is a valid parent (boolean, non-descendant), dispatch `setFlagParent`.
  - DnD active-drag state (which flag is being dragged) is stored in local `useState` in `FlagList` for visual feedback (optional, implementation-discretion per spec).
- **Alternatives considered**:
  - `react-beautiful-dnd` — archived/deprecated by Atlassian; React 19 incompatible.
  - `pragmatic-drag-and-drop` — Atlassian's successor; heavier and optimized for complex board UIs, overkill for a simple parent-assignment DnD.
  - HTML5 native drag-and-drop — no touch support, poor UX, inconsistent browser behavior; rejected.

## Decision 9: Type-Change Guard for Boolean Parent Flags

- **Decision**: The `updateFlag` store action gains a pre-condition: if a flag has `type === "boolean"` currently AND the update requests a different `type` AND the flag has at least one child (`getDirectChildren(flags, flagId).length > 0`), the update is silently rejected and the UI communicates the reason.
- **Rationale**: FR-001 (clarified) states the type change must be blocked when the flag has children. The guard belongs in the store action (single source of truth), not just in the UI, so it cannot be bypassed. The `getDirectChildren` utility from `flag-tree.ts` is the cheapest correct check (O(n) one-pass). The UI disables the type selector in `FlagEditRow` when the flag has children, providing pre-emptive feedback.
- **Alternatives considered**:
  - Guard only in the UI — rejected because the store would then allow invalid state if called programmatically.
  - Cascade type change to all children — rejected per clarification session (Option A chosen: block, not cascade).

## Summary: All Unknowns Resolved

| Unknown | Resolution |
|---------|-----------|
| Storage shape for hierarchy | Flat array + `parentId: string \| null` |
| Connector rendering | Pure CSS dashed borders, absolute positioning, Tailwind |
| Collapse state location | Feature Zustand store as `collapsedFlagIds: Set<string>` |
| Tree rendering strategy | Flat render-list with `{ flag, depth, isLastChild }` tuples |
| Collapse toggle placement | FlagElementContainer after name container in FlagRow |
| Parent eligibility | Boolean flags only; enforced in store + UI |
| Orphan handling on delete | Promote direct children to root in `deleteFlag` action |
| Drag-and-drop library | `@dnd-kit/core` + `@dnd-kit/utilities` (new dependency) |
| Type-change guard | Block `updateFlag` type change if flag has children; UI disables selector |
| Direct reparenting mechanism | `setFlagParent` covers both; DnD calls it on drop; "Move to…" calls it on picker select |
