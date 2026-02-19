# Quickstart: Nested Flag Groups

**Feature**: 003-flag-groups | **Date**: 2026-02-19

## Prerequisites

- Node.js 20+ and pnpm installed
- Repo cloned and on branch `003-flag-groups`

## Setup

```bash
pnpm install
# Install the new DnD dependency
pnpm --filter web add @dnd-kit/core @dnd-kit/utilities
```

## Development

Start the web app (frontend only — no backend changes in this feature):

```bash
pnpm --filter web dev
```

Open http://localhost:5173 in your browser.

## Key Files to Modify

| File | Change |
|------|--------|
| `apps/web/src/features/feature-flags/types/index.ts` | Add `parentId: string \| null` to `FeatureFlag` |
| `apps/web/src/features/feature-flags/store/index.ts` | Add `collapsedFlagIds`, `setFlagParent`, `toggleFlagCollapsed`; update `deleteFlag` |
| `apps/web/src/features/feature-flags/utils/flag-tree.ts` | NEW: `buildRenderList`, `hasDescendant`, `getDirectChildren` |
| `apps/web/src/features/feature-flags/components/flag-list/flag-row.tsx` | Add depth, connector, collapse toggle |
| `apps/web/src/features/feature-flags/components/flag-list/flag-connector.tsx` | NEW: CSS dashed elbow component |
| `apps/web/src/features/feature-flags/components/flag-list/flag-list.tsx` | Tree rendering via `buildRenderList` |
| `apps/web/src/features/feature-flags/components/flag-list/flag-menu.tsx` | Add "Add child flag", "Move to…", "Detach from parent" |
| `apps/web/src/features/feature-flags/components/flag-list/flag-move-to-menu.tsx` | NEW: searchable parent picker (shadcn Popover + Command) |
| `apps/web/src/features/feature-flags/components/flag-list/flag-create-row.tsx` | Accept optional `parentId` prop |
| `apps/web/src/features/feature-flags/hooks/use-flags-store.ts` | Add `useCollapsedFlagIds` hook |

## Running Tests

Unit tests (Vitest):

```bash
pnpm --filter web test
```

End-to-end tests (Playwright):

```bash
pnpm --filter web test:e2e
```

## Verification Checklist

After implementation, verify manually:

1. **Single-level group**: Create a boolean flag, add a child via its menu → child appears indented below parent with a dashed elbow connector.
2. **Multi-level nesting**: Add a boolean child, then add a child to that child → 3-level tree renders correctly with connectors at each level.
3. **Collapse/expand**: Click the collapse toggle (ChevronDown) after the flag name → children hide. Click again (ChevronRight) → children reappear.
4. **Connector shape - single child**: One child → connector terminates at that child, no trailing vertical line.
5. **Connector shape - multiple children**: All children share the vertical segment; each gets a horizontal branch; last child has no continuation.
6. **Ancestor lines**: At depth 3, columns for depth 1 and depth 2 ancestor vertical lines are visible alongside the grandchild row.
7. **Delete parent**: Delete a parent flag → its children appear at root level, retaining their own children.
8. **Detach child**: Use "Detach from parent" in child's menu → child moves to root level.
9. **Non-boolean blocked**: Attempting to add a child to a non-boolean flag via the store action → guarded, no mutation.
10. **Collapse toggle position**: The toggle container appears immediately to the right of the name container, consistent with other `FlagElementContainer` elements in the row.
11. **Drag-and-drop reparenting**: Drag a flag row and drop it onto a boolean parent → flag moves into that parent's group with connector.
12. **Move to… picker**: Open flag context menu → "Move to…" → searchable dropdown lists all eligible boolean parents → selecting one calls `setFlagParent`.
13. **Direct reparenting**: Move a child flag from Parent A to Parent B in one action (drag or menu) — no detach step required.
14. **Type change blocked**: Edit a boolean flag that has children → type selector is disabled; attempting via store action → no mutation.
15. **Type change to boolean**: Edit a non-boolean flag → change type to boolean → flag immediately becomes eligible as a parent (no error).

## Connector Visual Specification

```
Parent flag row:
┌──────────────────────────────────────────────────────────────┐
│ [icon] parent-flag-name  [chevron▼]  [spacer]  [toggle] ...  │
└──────────────────────────────────────────────────────────────┘
         │                  ← vertical dashed line
         ├─────────────── child-flag-1
         │
         └─────────────── child-flag-2 (isLastChild: true)
```

The connector for each child is an absolutely-positioned element to the left of the child row:
- **Non-last child**: L-shape with vertical line continuing downward past the horizontal branch
- **Last child**: L-shape with vertical line stopping at the branch point (elbow only)
- **Ancestor columns**: For flags at depth ≥ 2, each ancestor level that has a continuing sibling below renders a thin vertical dashed line at that level's indent column
