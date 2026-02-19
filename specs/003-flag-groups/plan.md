# Implementation Plan: Nested Flag Groups

**Branch**: `003-flag-groups` | **Date**: 2026-02-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-flag-groups/spec.md`

## Summary

Extend the existing flat feature-flag list to support a parent-child hierarchy. Any boolean flag can act as a parent; any flag (any type) can be a child. The hierarchy is rendered in-place using dashed CSS elbow connectors. A collapse/expand toggle (a `FlagElementContainer` immediately after the name container) appears on parent rows. Reparenting is done via drag-and-drop (primary, using `@dnd-kit/react`) and via a "Move to…" searchable dropdown in the flag's context menu (fallback). All hierarchy and collapse state lives in the existing Zustand store; no backend or persistence changes are required.

## Technical Context

**Language/Version**: TypeScript 5.x, strict mode, no `any`
**Primary Dependencies**: React 19.x, Zustand 5.x, Tailwind CSS v4, shadcn/ui, Lucide React, TanStack Router v1, `@dnd-kit/react` + `@dnd-kit/utilities` (new — drag-and-drop)
**Storage**: In-memory Zustand store only (no Prisma/SQLite changes for this feature)
**Testing**: Vitest (unit — tree utilities, store action guards), Playwright (e2e — collapse/expand, child assignment, drag-and-drop reparenting)
**Target Platform**: Web (Vite + React, `apps/web`)
**Project Type**: Monorepo web application (`apps/web/src/features/feature-flags/`)
**Performance Goals**: Tree rendering smooth for up to 100 flags across 5+ nesting levels
**Constraints**: Pure CSS connectors (no SVG/canvas); Tailwind utility classes only; no inline style props for static values; DnD must not conflict with existing row interactions (toggle switch, menu)
**Scale/Scope**: Single feature module; ~9 files modified, ~4 new files added

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Composition Over Prop Drilling | PASS | `FlagConnector`, `FlagMoveToMenu` are separate components. Collapse toggle uses `FlagElementContainer` composition. DnD wrappers are composable via `useDraggable`/`useDroppable` hooks at the row level. |
| II. Feature-Based Architecture | PASS | All new code stays inside `apps/web/src/features/feature-flags/`. `@dnd-kit` is a shared library import, not a feature. No cross-feature imports. |
| III. Type-Safe API Contract | PASS | Pure client-side feature. Store actions serve as typed internal contract. No tRPC/Prisma changes. |
| IV. State Isolation — Multiple Stores | PASS | `parentId`, `collapsedFlagIds` added to existing feature store only. DnD active-drag state is ephemeral (`useState` in `FlagList`). No cross-store dependencies. |
| V. Test Discipline | PASS | `flag-tree.ts` pure utilities + store action guards (type-change, cycle detection) MUST have Vitest unit tests. Collapse/expand, DnD reparenting, and "Move to…" picker MUST have Playwright e2e tests. |
| VI. Simplicity & YAGNI | PASS | `parentId: string \| null` is the minimal data change. `@dnd-kit/react` is the simplest DnD library for React 19 (no deprecated APIs). `flag-tree.ts` utility extracted because used in 3+ places (rendering, row props, tests). |

## Project Structure

### Documentation (this feature)

```text
specs/003-flag-groups/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── store-actions.md # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
apps/web/src/features/feature-flags/
├── components/
│   └── flag-list/
│       ├── flag-connector.tsx        ← NEW: dashed CSS elbow connector
│       ├── flag-move-to-menu.tsx     ← NEW: "Move to…" searchable parent picker
│       ├── flag-create-row.tsx       ← MODIFIED: accept optional parentId
│       ├── flag-edit-row.tsx         ← unchanged
│       ├── flag-list.tsx             ← MODIFIED: DnD context + tree rendering
│       ├── flag-menu.tsx             ← MODIFIED: "Add child", "Move to…", "Detach"
│       └── flag-row.tsx              ← MODIFIED: depth, connector, collapse toggle, DnD
├── hooks/
│   └── use-flags-store.ts            ← MODIFIED: add useCollapsedFlagIds hook
├── store/
│   └── index.ts                      ← MODIFIED: parentId, collapsedFlagIds, new/updated actions
├── types/
│   └── index.ts                      ← MODIFIED: add parentId to FeatureFlag
└── utils/
    ├── flag-tree.ts                   ← NEW: tree build / traversal utilities
    └── format-time.ts                 ← unchanged
```

**Structure Decision**: Monorepo Option 2. All changes confined to `apps/web`. No `backend/` or `packages/` changes.

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design artifacts.*

All 6 principles confirmed passing. Additional review for clarification-driven changes:
- `FlagMoveToMenu` is a new leaf component (picker for parent selection) — no prop-drilling chain; receives a list of candidate parents and an `onSelect` callback. Principle I: PASS.
- DnD ephemeral state (which flag is being dragged) lives as `useState` in `FlagList`, not in the Zustand store — it is genuinely ephemeral and project-scoped to the render cycle. Principle IV: PASS.
- `updateFlag` gains a type-change guard; the guard logic is a one-liner using `getDirectChildren` from `flag-tree.ts`. No new abstraction needed. Principle VI: PASS.

## Complexity Tracking

> No violations to justify.
