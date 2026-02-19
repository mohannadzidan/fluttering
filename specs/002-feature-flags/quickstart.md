# Quickstart: Feature Flags Management UI

**Branch**: `002-feature-flags` | **Date**: 2026-02-19

This guide walks a developer from a clean checkout to a working feature flags UI in the browser.

---

## Prerequisites

- pnpm 10.x installed globally
- Node 20+
- The `002-feature-flags` branch checked out

---

## Step 1 — Install Zustand

Zustand is mandated by the constitution but not yet installed. Add it to the web app:

```bash
pnpm --filter web add zustand
```

Verify in `apps/web/package.json`:

```json
"zustand": "^5.x.x"
```

---

## Step 2 — Start the Dev Server

The feature is UI-only. Only the frontend needs to run:

```bash
pnpm --filter web dev
```

Visit `http://localhost:5173`.

> The backend server (`pnpm --filter server dev`) is NOT required for this feature.

---

## Step 3 — File Layout to Create

All new files go under `apps/web/src/features/feature-flags/`. Create the directory structure:

```
apps/web/src/features/feature-flags/
├── components/
│   ├── sidebar/
│   │   ├── flags-sidebar.tsx        # Collapsible sidebar wrapper
│   │   └── project-selector.tsx     # Project dropdown
│   ├── flag-list/
│   │   ├── flag-list.tsx            # List container + empty state
│   │   ├── flag-row.tsx             # Read-only flag display row
│   │   ├── flag-create-row.tsx      # Inline creation form row
│   │   ├── flag-edit-row.tsx        # Inline edit form row
│   │   └── flag-menu.tsx            # DropdownMenu (Edit / Delete)
│   ├── flags-layout.tsx             # Root layout: sidebar + panel
│   └── flag-type-icon.tsx           # Icon selector by FlagType
├── hooks/
│   └── use-flags-store.ts           # Typed Zustand selector hooks
├── store/
│   └── index.ts                     # Zustand store (createStore)
├── types/
│   └── index.ts                     # All TypeScript types (from contract)
├── utils/
│   └── format-time.ts               # Timestamp formatting (date-fns)
└── index.ts                         # Public API: export FlagsLayout
```

---

## Step 4 — Files to Modify

These shared files require targeted changes:

| File | Change |
|------|--------|
| `apps/web/src/index.css` | Add dark violet theme CSS variables (override `.dark`) |
| `apps/web/src/routes/__root.tsx` | Remove `<Header />`, adapt layout for full-screen sidebar shell |
| `apps/web/src/routes/index.tsx` | Replace health-check placeholder with `<FlagsLayout />` render |

---

## Step 5 — Theme Color Overrides

In `apps/web/src/index.css`, override the `.dark` block to apply the Fluttering brand palette.
Also add `--color-cosmic` and `--color-radiate` tokens to `@theme inline`.

```css
/* Dark Violet Theme — Fluttering Brand */
.dark {
  --background:           oklch(0.16 0.10 307);   /* #30173d */
  --foreground:           oklch(0.84 0.04 307);   /* #e3cee3 */
  --card:                 oklch(0.20 0.10 307);
  --card-foreground:      oklch(0.84 0.04 307);
  --popover:              oklch(0.20 0.10 307);
  --popover-foreground:   oklch(0.84 0.04 307);
  --primary:              oklch(0.65 0.21 300);   /* #de5fe9 cosmic */
  --primary-foreground:   oklch(0.10 0.05 307);
  --secondary:            oklch(0.22 0.10 307);
  --secondary-foreground: oklch(0.84 0.04 307);
  --muted:                oklch(0.22 0.10 307);
  --muted-foreground:     oklch(0.60 0.04 307);
  --accent:               oklch(0.25 0.10 307);
  --accent-foreground:    oklch(0.84 0.04 307);
  --destructive:          oklch(0.58 0.22 27);
  --border:               oklch(1 0 0 / 8%);
  --input:                oklch(1 0 0 / 12%);
  --ring:                 oklch(0.65 0.21 300);   /* cosmic for focus rings */
  --sidebar:              oklch(0.14 0.10 307);
  --sidebar-foreground:   oklch(0.84 0.04 307);
  --sidebar-primary:      oklch(0.65 0.21 300);
  --sidebar-primary-foreground: oklch(0.10 0.05 307);
  --sidebar-accent:       oklch(0.20 0.10 307);
  --sidebar-accent-foreground: oklch(0.84 0.04 307);
  --sidebar-border:       oklch(1 0 0 / 8%);
  --sidebar-ring:         oklch(0.65 0.21 300);
}

/* Add to @theme inline block */
@theme inline {
  /* ... existing tokens ... */
  --color-radiate: oklch(0.84 0.04 307);   /* #e3cee3 */
  --color-cosmic:  oklch(0.65 0.21 300);   /* #de5fe9 */
}
```

---

## Step 6 — Store Implementation Outline

`apps/web/src/features/feature-flags/store/index.ts`:

```typescript
import { create } from "zustand";
import type { FeatureFlagsStore } from "../types";
import { SEED_PROJECTS, SEED_FLAGS } from "../types";

export const useFeatureFlagsStore = create<FeatureFlagsStore>((set) => ({
  // Initial state
  projects: SEED_PROJECTS,
  selectedProjectId: SEED_PROJECTS[0].id,
  flags: SEED_FLAGS,
  sidebarOpen: true,

  // Actions
  selectProject: (projectId) => set({ selectedProjectId: projectId }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  addFlag: (projectId, name, type) =>
    set((state) => {
      const now = new Date();
      const newFlag = {
        id: crypto.randomUUID(),
        name: name.trim(),
        type,
        value: false, // default for boolean
        createdAt: now,
        updatedAt: now,
      };
      return {
        flags: {
          ...state.flags,
          [projectId]: [...(state.flags[projectId] ?? []), newFlag],
        },
      };
    }),
  updateFlag: (projectId, flagId, updates) =>
    set((state) => ({
      flags: {
        ...state.flags,
        [projectId]: (state.flags[projectId] ?? []).map((f) =>
          f.id === flagId ? { ...f, ...updates, updatedAt: new Date() } : f
        ),
      },
    })),
  toggleFlagValue: (projectId, flagId) =>
    set((state) => ({
      flags: {
        ...state.flags,
        [projectId]: (state.flags[projectId] ?? []).map((f) =>
          f.id === flagId && f.type === "boolean"
            ? { ...f, value: !f.value, updatedAt: new Date() }
            : f
        ),
      },
    })),
  deleteFlag: (projectId, flagId) =>
    set((state) => ({
      flags: {
        ...state.flags,
        [projectId]: (state.flags[projectId] ?? []).filter((f) => f.id !== flagId),
      },
    })),
}));
```

---

## Step 7 — Running Tests

Unit tests (Vitest) — run from repo root:

```bash
pnpm test
```

Lint check:

```bash
pnpm lint
```

Type check:

```bash
pnpm --filter web check-types
```

E2E tests (Playwright) — after implementing:

```bash
pnpm --filter web playwright test
```

---

## Key Decisions Recap

| Decision | Choice | Why |
|----------|--------|-----|
| State | Zustand (one store) | Constitution Principle IV |
| Routing | TanStack Router, index route | Mandated; flags are the primary page |
| Sidebar | shadcn/ui `<Sidebar>` | Already installed (Principle VI) |
| Toggle | shadcn/ui `<Switch>` | Already installed, semantically correct |
| Type icon | Lucide `ToggleRight` | Extensible icon-per-type pattern |
| Timestamps | date-fns `formatDistanceToNow` | Already installed; relative time is human-friendly |
| Menu | shadcn/ui `<DropdownMenu>` | Already installed; keyboard-accessible |
| Theme | CSS variable override in `.dark` | Tailwind v4 compatible, DRY |
| Inline edit | Uncontrolled inputs + Enter/Escape | No form library needed for 2 fields |
