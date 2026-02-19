# Implementation Plan: Feature Flags Management UI

**Branch**: `002-feature-flags` | **Date**: 2026-02-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-feature-flags/spec.md`

## Summary

Build the primary feature of the Fluttering app: a feature flag management UI. The initial
release supports boolean (true/false) flags only, with the data model and component structure
designed for future flag types. The entire feature is client-side (Zustand store, no backend).
The UI introduces a collapsible sidebar with project selection, a flags panel with inline
create/edit, and a custom dark violet brand theme applied globally via CSS variable overrides.

## Technical Context

**Language/Version**: TypeScript 5.x strict mode, React 19.x
**Primary Dependencies**: Zustand 5.x (new, to be installed), shadcn/ui (existing), Lucide React (existing), date-fns v4 (existing), TanStack Router v1 (existing)
**Storage**: None — in-memory Zustand store only; no persistence
**Testing**: Vitest (unit tests for utils), Playwright (E2E for critical journeys)
**Target Platform**: Web browser, Vite SPA (Chromium / Firefox / Safari modern)
**Project Type**: Web (monorepo `apps/web` frontend only; no backend changes)
**Performance Goals**: Toggle response < 16ms (single render cycle); sidebar collapse animation < 300ms
**Constraints**: No network calls, no localStorage/sessionStorage, state resets on page refresh
**Scale/Scope**: Single user, single session; initially 2 seeded projects with sample flags

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

### Principle I — Composition Over Prop Drilling ✅ PASS

`FlagRow` will NOT use boolean props for variations (e.g., no `isEditing`, `isCreating` props
on the same component). Instead, three separate components handle each state:
- `FlagRow` — read-only display
- `FlagCreateRow` — inline creation form
- `FlagEditRow` — inline edit form

The `FlagsLayout` composes `FlagsSidebar` and `FlagList` as siblings, not via prop drilling.
`FlagMenu` (DropdownMenu) is a standalone composition unit consumed inside `FlagRow`.
No component accumulates more than 3 configuration props.

### Principle II — Feature-Based Architecture ✅ PASS

All feature code is under `apps/web/src/features/feature-flags/` with the mandated subfolders.
Cross-cutting changes are minimal and justified:
- `index.css` — theme tokens must be global (CSS cascade requirement)
- `__root.tsx` — layout restructure for full-screen sidebar shell (affects whole app)
- `routes/index.tsx` — entry point for the feature flags page (necessary route change)

No other shared files are touched. The feature's public surface is `index.ts` only.

### Principle III — Type-Safe API Contract ✅ N/A

This feature has zero network communication. No tRPC procedures, no fetch calls, no Prisma
queries. The principle applies to network boundaries only; it does not apply here.

### Principle IV — State Isolation ✅ PASS

One Zustand store for the entire feature-flags domain:
`apps/web/src/features/feature-flags/store/index.ts`

No other Zustand stores exist yet; this is the first. No TanStack Query is used (no server
state). The store does not import or invoke other stores' actions.

### Principle V — Test Discipline ✅ PLANNED

- **Vitest unit tests**: `format-time.ts` utility (relative time formatting edge cases)
- **Playwright E2E**: Flag creation flow, toggle, edit, delete (per spec user stories P1–P3)
- Tests will be authored alongside implementation (not retrospectively)

### Principle VI — Simplicity & YAGNI ✅ PASS

- No form library for inline create/edit (two fields, uncontrolled inputs)
- No abstraction for the type icon beyond a simple switch statement (only one type now)
- shadcn/ui components used as-is; no wrapper layers introduced
- No persistence layer (not needed per spec)
- `FlagTypeIcon` and `FlagValueControl` remain simple until the second flag type is added
  (rule of three: no abstraction until third occurrence)

### Complexity Tracking

No violations. No entries required.

## Project Structure

### Documentation (this feature)

```text
specs/002-feature-flags/
├── plan.md              # This file (/speckit.plan output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 research decisions
├── data-model.md        # Phase 1 data model
├── quickstart.md        # Phase 1 developer guide
├── contracts/
│   └── store-contract.ts  # TypeScript type definitions
├── checklists/
│   └── requirements.md    # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (repository root)

```text
apps/web/src/
├── features/
│   └── feature-flags/             # Feature module (NEW)
│       ├── components/
│       │   ├── flags-layout.tsx           # Root layout: sidebar + panel
│       │   ├── sidebar/
│       │   │   ├── flags-sidebar.tsx      # Collapsible sidebar (wraps shadcn Sidebar)
│       │   │   └── project-selector.tsx   # Project dropdown (Select component)
│       │   ├── flag-list/
│       │   │   ├── flag-list.tsx          # List container + "Add new flag..." button + empty state
│       │   │   ├── flag-row.tsx           # Read-only flag display row
│       │   │   ├── flag-create-row.tsx    # Inline flag creation form row
│       │   │   ├── flag-edit-row.tsx      # Inline flag edit form row
│       │   │   └── flag-menu.tsx          # DropdownMenu for Edit/Delete
│       │   └── flag-type-icon.tsx         # Lucide icon selector by FlagType
│       ├── hooks/
│       │   └── use-flags-store.ts         # Typed Zustand selector hooks
│       ├── store/
│       │   └── index.ts                   # Zustand store (createStore + actions)
│       ├── types/
│       │   └── index.ts                   # All TypeScript types + seed data constants
│       ├── utils/
│       │   └── format-time.ts             # Timestamp formatting (date-fns)
│       └── index.ts                       # Public API: export FlagsLayout only
│
├── routes/                               # MODIFIED (existing files)
│   ├── __root.tsx                        # Remove <Header />; adapt to full-screen layout
│   └── index.tsx                         # Replace placeholder with <FlagsLayout />
│
└── index.css                             # MODIFIED: dark violet theme CSS variable overrides
```

**Structure Decision**: Web application layout (Option 2 equivalent, frontend only). The
feature lives entirely in `apps/web/src/features/feature-flags/`. Backend packages are
untouched. This is the first feature module establishing the pattern for all future features.

## Component Hierarchy

```
FlagsLayout                         # apps/web/src/features/feature-flags/components/flags-layout.tsx
├── SidebarProvider                 # shadcn/ui — manages open/collapsed state
│   ├── FlagsSidebar                # features/.../sidebar/flags-sidebar.tsx
│   │   ├── SidebarHeader
│   │   │   └── [Fluttering logo]
│   │   ├── SidebarContent
│   │   │   ├── ProjectSelector     # features/.../sidebar/project-selector.tsx
│   │   │   └── SidebarSeparator
│   │   └── SidebarTrigger          # collapse/expand button
│   └── SidebarInset                # Main panel (fills remaining space)
│       └── FlagList                # features/.../flag-list/flag-list.tsx
│           ├── FlagRow[]           # features/.../flag-list/flag-row.tsx
│           │   ├── [flag name]
│           │   ├── FlagTypeIcon    # features/.../flag-type-icon.tsx
│           │   ├── [Switch]        # shadcn/ui Switch (boolean value)
│           │   ├── [CalendarPlus + createdAt]
│           │   ├── [CalendarClock + updatedAt]
│           │   └── FlagMenu        # features/.../flag-list/flag-menu.tsx
│           │       └── DropdownMenu [Edit, Delete]
│           ├── FlagCreateRow?      # features/.../flag-list/flag-create-row.tsx (conditional)
│           │   ├── [name input]
│           │   └── [type selector]
│           └── [Add new flag... button]
```

## Data Flow

```
User Action
    │
    ▼
Component event handler (onClick, onKeyDown)
    │
    ▼
Store action (useFeatureFlagsStore.getState().toggleFlagValue(...))
    │
    ▼
Zustand immer-style set() → new state object
    │
    ▼
React re-render (only components subscribed to changed slice)
    │
    ▼
Updated UI (toggle switch flips, timestamp refreshes)
```

## Theme Architecture

The existing shadcn/ui CSS variable system is used as-is. The `.dark` block in `index.css`
is overridden to apply the Fluttering brand palette. Since `ThemeProvider` defaults to dark
mode, the brand colors are always active. The two named tokens (`--color-radiate` and
`--color-cosmic`) are added to the `@theme inline` block for use as Tailwind utilities
(`text-radiate`, `bg-cosmic`, `border-cosmic`, etc.).

## Key Implementation Notes

1. **Sidebar open state**: The shadcn/ui `SidebarProvider` manages its own open/collapsed
   state internally. The feature store's `sidebarOpen` field is NOT needed — remove it from
   the store. The sidebar state is ephemeral UI state, not feature domain state.

2. **Inline row switching**: `FlagList` renders a `mode` state (`"list" | "creating"`).
   When `mode === "creating"`, a `FlagCreateRow` is appended after all `FlagRow` items.
   When a row enters edit mode, `FlagList` tracks the `editingFlagId` and renders
   `FlagEditRow` in place of the corresponding `FlagRow`.

3. **`key` prop on inline rows**: Always key `FlagCreateRow` and `FlagEditRow` by the
   `selectedProjectId` so that switching projects automatically discards in-progress edits.

4. **`formatTime` utility**: Located at `utils/format-time.ts`. Exports a single function
   `formatFlagTime(date: Date): string` that implements the relative/absolute logic.
   Must have Vitest unit tests covering: < 1 min, 5 min, 1 hr, 1 day, > 1 day cases.

5. **`FlagTypeIcon` component**: A simple component with a `switch (type)` returning the
   correct Lucide icon. Takes a `className` prop for sizing. No additional props.

6. **Tab order in flag rows**: `[name text] → [type icon] → [Switch] → [menu button]`.
   The Switch and menu button must be keyboard-reachable in natural tab order.

## Testing Plan

### Vitest Unit Tests

Location: `apps/web/src/features/feature-flags/utils/format-time.test.ts`

| Test case | Input | Expected output |
|-----------|-------|-----------------|
| < 1 min   | now - 30s | "just now" |
| 5 min ago | now - 5min | "5 min ago" |
| 1 hr ago  | now - 1hr  | "1 hr ago"  |
| Yesterday | now - 20hr | "20 hr ago" |
| Old date  | now - 2d   | "Feb 17, 2026" |

### Playwright E2E Tests

Location: `apps/web/e2e/feature-flags.spec.ts`

| Journey | Steps | Assertion |
|---------|-------|-----------|
| Toggle flag | Click switch on "dark-mode" | Switch visual state flips; "Updated" time refreshes |
| Create flag | Click "Add new flag..." → type name → Enter | New row appears in list with `false` value |
| Create empty | Click "Add new flag..." → Enter immediately | Row stays; name field highlighted |
| Delete flag | Click menu → Delete | Flag row removed from list |
| Edit flag name | Click menu → Edit → change name → Enter | Flag row shows new name |
| Escape creation | Click "Add new flag..." → press Escape | Row disappears; no new flag |
| Collapse sidebar | Click SidebarTrigger | Sidebar collapses; panel expands |
| Switch project | Select "Staging" in dropdown | Flags panel shows Staging's flags |
