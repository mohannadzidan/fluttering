# Feature Specification: Nested Flag Groups

**Feature Branch**: `003-flag-groups`
**Created**: 2026-02-19
**Status**: Draft
**Input**: User description: "the requirements is to support flag groups, the boolean flags can have child flags, visualized by a dashed elbow border coming from right under of parent row down then going right to connect to the child flag from the center left end. There is an ability to have as many as nested levels"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Flags in a Parent-Child Hierarchy (Priority: P1)

A user opens the feature flags list and sees flags organized in a tree. Boolean parent flags display their children indented beneath them, connected by a dashed elbow connector — a vertical dashed line descending from below the parent row, then turning right to reach the center-left of each child row.

**Why this priority**: The visual hierarchy is the core deliverable of this feature. Without it, flag groups have no meaning to the user.

**Independent Test**: Load a flags list containing at least one boolean parent flag with two children. Verify the dashed elbow connector renders correctly and children appear indented below the parent.

**Acceptance Scenarios**:

1. **Given** a flags list with a boolean flag that has two child flags, **When** the user views the list, **Then** each child flag appears indented below the parent, connected by a dashed elbow border originating from below the parent row, going down, then turning right to meet the center-left of the child row.
2. **Given** a flags list with three levels of nesting (grandparent → parent → grandchild), **When** the user views the list, **Then** each level of nesting is visually distinct: indentation increases per level and each level has its own dashed connector.
3. **Given** a boolean parent flag with a single child, **When** the user views the list, **Then** the connector terminates at that single child with no dangling vertical line below it.
4. **Given** a boolean parent flag with multiple children, **When** the user views the list, **Then** the vertical segment of the dashed connector runs the full height from below the parent to the last child, with a horizontal branch turning right at each child row.

---

### User Story 2 - Assign a Child Flag to a Boolean Parent (Priority: P1)

A user designates an existing flag as a child of a boolean parent flag, or creates a new child flag directly under a parent. Assignment is done by dragging a flag row onto a target parent (primary) or via the "Move to…" picker in the flag's context menu (fallback). The child flag immediately appears in the hierarchy view with its connector.

**Why this priority**: Without the ability to create or assign child flags, the hierarchy cannot be built.

**Independent Test**: Starting from a flat list of flags, assign one flag as a child of a boolean flag. The flag list should then show the child indented under the parent with a dashed connector.

**Acceptance Scenarios**:

1. **Given** a boolean flag in the list, **When** the user adds a new child flag under it, **Then** the new flag appears in the list beneath the parent, indented and connected with a dashed elbow border.
2. **Given** an existing root-level flag, **When** the user assigns it as a child of a boolean flag, **Then** it moves to appear beneath that parent with the dashed connector, removed from its previous root position.
3. **Given** a flag already assigned as a child of Parent A, **When** the user uses "Move to…" to assign it to Parent B, **Then** the flag appears under Parent B with its connector and no longer appears under Parent A — in a single action.
4. **Given** a user attempts to assign a child to a non-boolean flag, **Then** the system prevents this action and communicates that only boolean flags can be parents.

---

### User Story 3 - Create a Multi-Level Nested Hierarchy (Priority: P2)

A user creates flag groups more than one level deep: a boolean parent flag has a boolean child flag, which itself has its own child flags. Each level of nesting renders with its own correctly positioned dashed elbow connector.

**Why this priority**: Multi-level nesting is explicitly required but is incremental on top of single-level grouping.

**Independent Test**: Create a 3-level hierarchy (A → B → C). Confirm the flag list renders three levels of indentation with connectors at each level, each visually distinct.

**Acceptance Scenarios**:

1. **Given** a 3-level hierarchy (grandparent → parent → grandchild), **When** the user views the flags list, **Then** each level has its own dashed elbow connector and each level is further indented than the one above.
2. **Given** nesting at level N, **When** an additional child is added at level N+1, **Then** the new nesting level appears with a properly indented and connected row without breaking existing connectors.
3. **Given** any nesting depth, **When** the user views the list, **Then** vertical connector lines for ancestor levels remain visible alongside child rows, clarifying the full ancestral path.

---

### User Story 4 - Remove a Flag from a Group (Priority: P2)

A user detaches a child flag from its parent, returning it to the flat root level. The hierarchy updates immediately.

**Why this priority**: Group membership must be editable; without this, users are locked into incorrect hierarchies.

**Independent Test**: Remove a child flag from its parent. Confirm it appears at root level with no connector, and the parent's connector updates or disappears if no children remain.

**Acceptance Scenarios**:

1. **Given** a flag that is a child of a parent, **When** the user removes it from the group, **Then** the flag appears in the flat list at root level with no connector, and the parent's connector updates accordingly.
2. **Given** a parent flag whose only child is removed, **When** that child is detached, **Then** the parent flag remains in the list but no longer shows a connector or child indent.
3. **Given** a flag with its own children (middle of a hierarchy), **When** the flag is detached from its parent, **Then** its own children remain attached to it and move with it to the new position.

---

### User Story 5 - Collapse and Expand a Parent Flag's Children (Priority: P2)

A user clicks a toggle on a parent flag row to collapse it, hiding all its children (and any deeper descendants). Clicking again expands the parent to restore the full subtree. The toggle visually reflects the current state at all times.

**Why this priority**: Collapse/expand is essential for usability when hierarchies grow deep or lists become long, but the core hierarchy view is still viable without it.

**Independent Test**: With a parent flag that has at least 2 children, click the collapse toggle. Children disappear from the list. Click again — children reappear. The toggle indicator changes state each time.

**Acceptance Scenarios**:

1. **Given** a parent flag is expanded (children visible), **When** the user clicks the toggle on the parent row, **Then** all children (and their descendants) are hidden from view and the toggle indicator reflects the collapsed state.
2. **Given** a parent flag is collapsed (children hidden), **When** the user clicks the toggle, **Then** all direct children are shown and any previously expanded sub-parents restore their last known state.
3. **Given** a 3-level hierarchy where the top parent is collapsed, **When** the user expands the top parent, **Then** only the direct children appear; grandchildren remain hidden if their parent was previously collapsed.
4. **Given** a parent flag is collapsed, **When** a new child flag is added to it, **Then** the child is added to the group but remains hidden until the parent is expanded.

---

### Edge Cases

- What happens when a boolean parent flag is deleted and it has children? (Children should be promoted to root level, not deleted.)
- How does the connector render when the list is long and the parent row scrolls off-screen while children remain visible?
- Switching a flag's type to boolean makes it immediately eligible as a parent. Switching a boolean flag's type away from boolean is blocked if it already has children; the user must first detach or move all children before the type can be changed (see FR-001).
- How many nesting levels are practical before indentation overflows the row width? (No hard cap, but layout must degrade gracefully.)
- Direct reparenting is supported: a child flag can be moved from one boolean parent to another in a single "Move to…" action. "Detach from parent" is a separate action that returns the flag to root level (see FR-008, FR-012).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Only boolean flags MUST be eligible to act as parent flags (have child flags assigned to them). A flag whose type is changed to boolean becomes immediately eligible as a parent. A boolean flag that already has one or more children MUST NOT have its type changed away from boolean; the system MUST block the type change and communicate why.
- **FR-002**: A child flag MUST be rendered indented below its parent flag in the flags list, connected by a dashed elbow border originating from below the parent row, descending vertically, then turning horizontally right to reach the center-left of the child flag row.
- **FR-003**: For a parent with multiple children, the vertical segment of the dashed connector MUST span from below the parent row to the last child row, with a horizontal branch turning right at each child.
- **FR-004**: The system MUST support arbitrary nesting depth; a child flag that is boolean MAY itself have child flags, and so on recursively with no enforced maximum level.
- **FR-005**: Each nesting level MUST be visually distinguished by increased horizontal indentation, with its own dashed elbow connector at the correct indent position.
- **FR-006**: Users MUST be able to assign an existing root-level flag as a child of a boolean parent flag. This MUST be achievable via drag-and-drop (primary) and via a "Move to…" picker in the flag's context menu (fallback).
- **FR-007**: Users MUST be able to create a new flag directly as a child of a boolean parent flag.
- **FR-008**: Users MUST be able to detach a child flag from its parent, returning it to the root level ("Detach from parent" action in the context menu).
- **FR-009**: When a parent flag is deleted, its direct children MUST be promoted to the root level and not deleted.
- **FR-010**: The system MUST prevent assigning a flag as a child of a non-boolean flag and communicate why.
- **FR-011**: Users MUST be able to collapse a parent flag to hide its children and expand it again to reveal them. A visual toggle indicator (e.g., chevron or arrow) on the parent row MUST reflect the current expanded/collapsed state. Collapsing a parent also hides all descendants at any depth beneath it. The default state for a parent flag is expanded.
- **FR-012**: Users MUST be able to move a child flag directly from one boolean parent to a different boolean parent in a single action. This MUST be achievable via drag-and-drop onto the target parent row (primary) and via a "Move to…" searchable dropdown in the flag's context menu (fallback).

### Key Entities

- **Flag**: A feature flag with a name, type (boolean or other), value, and an optional reference to a parent flag.
- **FlagGroup**: The parent-child relationship; a boolean flag with one or more assigned child flags forming a logical group.
- **Connector**: The dashed elbow border visual element linking a parent row to each of its child rows in the list UI.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can identify at a glance which flags are children of a parent flag, without additional explanation or a legend.
- **SC-002**: A user can build a flag hierarchy of at least 5 nesting levels, with each level's connector rendering correctly without visual overlap or truncation.
- **SC-003**: Assigning a child flag to a parent or removing it from a group completes in 2 or fewer user interactions.
- **SC-004**: The connector visuals remain correctly positioned for parent flags with up to 20 children without layout degradation.
- **SC-005**: When a parent flag is deleted, 100% of its direct children are automatically promoted to root level with no data loss.

## Clarifications

### Session 2026-02-19

- Q: Can a child flag be moved directly from one parent to another, or must it first be detached? → A: Both — "Detach from parent" returns to root; a separate "Move to…" action enables direct reparenting in one step.
- Q: What happens when a boolean parent flag (with children) has its type changed to non-boolean? → A: The type change is blocked; the user is informed they must detach or move all children first.
- Q: What is the UI mechanism for assigning/moving an existing flag to a parent? → A: Both — drag-and-drop as primary interaction; "Move to…" searchable dropdown in the context menu as fallback.
- Q: Is keyboard accessibility required for the collapse toggle and drag-and-drop interactions? → A: No explicit keyboard requirement; the "Move to…" context menu inherently provides keyboard-accessible reparenting.
- Q: What visual feedback should drag-and-drop show for valid vs. invalid drop targets? → A: No spec constraint; drop target styling is left to implementation discretion.

## Assumptions

- Child flags can be of any flag type (boolean, string, number, etc.); only the **parent** must be boolean.
- The flags list renders as a single combined flat/tree view, consistent with the existing flags UI — no separate tree panel.
- Reordering flags within a group (changing child order) is out of scope for this feature.
- Parent flags support collapse/expand via a toggle on the parent row. Default state is expanded. Collapsing hides all descendants at any depth.
- The visual connector style is dashed (not dotted, not solid), matching the described design exactly.
- The connector stroke style is consistent across all nesting levels (same dash pattern, same color).
- No keyboard-specific accessibility requirements are in scope for this feature. The context menu ("Move to…") provides an inherently keyboard-accessible path for all reparenting interactions.
- Drag-and-drop drop target visual styling (hover highlights, cursor changes) is left to implementation discretion; no spec-level constraint applies.
