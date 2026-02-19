# Research: Feature Flags Management UI

**Branch**: `002-feature-flags` | **Phase**: 0 | **Date**: 2026-02-19

## Summary

All technical decisions resolved. No external APIs or backend integration required. This is a
pure client-side UI feature. Every dependency is already in the stack or can be added without
changing the architecture.

---

## Decision 1: State Management — Zustand

**Decision**: Use Zustand v5 with the multiple-stores pattern (one store per feature domain).

**Rationale**: Constitution Principle IV mandates Zustand for client state. There is no remote
data in this feature (no backend), so TanStack Query is not needed. Zustand is listed in the
constitution's technology stack but is not yet installed in `apps/web`. It must be added as a
dependency before implementation begins.

**Installation**: `pnpm --filter web add zustand` (in the `apps/web` workspace).

**Store location**: `apps/web/src/features/feature-flags/store/index.ts`

**Alternatives considered**:
- React Context + useReducer: Adequate for this scale but rejected — Zustand is the mandated
  client-state library and provides cleaner selector ergonomics and devtools support.
- TanStack Query with custom storage: Rejected — TQ manages server state only (Principle IV).

---

## Decision 2: Routing — TanStack Router File-Based Routes

**Decision**: The feature flags UI will be the primary page rendered at the `/` (index) route.
A new index route replaces the current health-check index with the full feature flags layout.

**Rationale**: TanStack Router is the mandated routing library (constitution). File-based routes
live in `apps/web/src/routes/`. The index route is the natural home for the app's primary
feature. The existing index route is a development placeholder (health check + ASCII art).

**Route structure**:
```
apps/web/src/routes/
├── __root.tsx          # Modified: remove Header, adapt to full-screen layout
└── index.tsx           # Modified: renders FeatureFlagsLayout
```

**Alternatives considered**:
- Dedicated `/flags` route: Rejected — the app's primary purpose is feature flags, so
  the root is the right home. No navigation hierarchy needed yet.
- Layout route (`_layout.tsx`): Considered but unnecessary — the root layout is sufficient.

---

## Decision 3: Sidebar — shadcn/ui Sidebar Component

**Decision**: Use the existing `apps/web/src/components/ui/sidebar.tsx` (shadcn/ui) as the
base for the collapsible sidebar. Compose it with a custom `ProjectSelector` dropdown.

**Rationale**: shadcn/ui sidebar is already installed and provides `SidebarProvider`,
`Sidebar`, `SidebarContent`, `SidebarHeader`, and `useSidebar` — all needed for collapsible
behaviour. Reusing it avoids redundant code (Principle VI).

**Key components used**: `SidebarProvider`, `Sidebar`, `SidebarContent`, `SidebarHeader`,
`SidebarTrigger`, `SidebarInset`, `SidebarSeparator`.

**Alternatives considered**:
- Custom CSS sidebar with React state: Rejected — shadcn/ui sidebar is already installed,
  provides accessible keyboard shortcut (Cmd+B), and manages open/closed state internally
  via its own context. Reinventing it would violate Principle VI.

---

## Decision 4: Boolean Toggle — shadcn/ui Switch

**Decision**: Use the existing shadcn/ui `Switch` component for boolean flag value control.

**Rationale**: Switch is already installed in `apps/web/src/components/ui/switch.tsx`.
It is semantically correct for a boolean on/off control and is accessible.

**Alternatives considered**:
- Custom toggle button: Rejected — shadcn/ui Switch is already available (Principle VI).
- Checkbox: Rejected — Switch communicates binary state more clearly for feature flags.

---

## Decision 5: Flag Type Icon — Lucide React

**Decision**: Use `ToggleRight` icon from `lucide-react` to represent the `boolean` flag type.
Use `Clock` icon for both `createdAt` and `updatedAt` timestamps (with different labels).

**Rationale**: `lucide-react` is already installed. `ToggleRight` visually communicates
on/off toggling, which directly maps to the boolean concept. The icon system is designed to
be extensible: future flag types (`string`, `number`, `json`) will each get a distinct icon
from the same library.

**Icon mapping**:
| Flag Type | Icon           | Lucide component |
|-----------|---------------|-----------------|
| boolean   | Toggle switch  | `ToggleRight`    |
| (future) string | Text/quote | `Quote` or `Text` |
| (future) number | Hash  | `Hash`           |
| (future) json  | Braces | `Braces`         |

**Timestamp icons**:
| Field      | Icon  | Lucide component |
|------------|-------|-----------------|
| createdAt  | Plus-clock | `CalendarPlus` |
| updatedAt  | Edit-clock | `CalendarClock` |

**Alternatives considered**:
- Text labels (`boolean`, `string`): Rejected per user requirement — icons only.
- Custom SVG icons: Rejected — Lucide already has appropriate icons (Principle VI).

---

## Decision 6: Timestamp Formatting — date-fns

**Decision**: Use `date-fns` (already installed as `date-fns@^4.1.0`) for formatting
timestamps. Display as relative time (e.g., "2 min ago") using `formatDistanceToNow`.

**Rationale**: date-fns is already a dependency. Relative time ("just now", "5 min ago") is
more human-friendly for a flag management UI than absolute ISO timestamps. For very recent
events, show "just now" (< 1 minute). For older flags, show the absolute date.

**Format rules**:
- < 1 minute: "just now"
- < 1 hour: "X min ago"
- < 24 hours: "X hr ago"
- ≥ 24 hours: "MMM d, yyyy" (absolute)

**Alternatives considered**:
- `Intl.RelativeTimeFormat`: Rejected — more boilerplate, date-fns is simpler and already available.
- Raw ISO string: Rejected — poor readability in a dense flag list.

---

## Decision 7: Context Menu — shadcn/ui DropdownMenu

**Decision**: Use the existing shadcn/ui `DropdownMenu` component for the per-flag
menu popup (Edit / Delete actions).

**Rationale**: `DropdownMenu` is already installed and provides keyboard navigation,
focus management, and Escape-to-close behaviour out of the box. It renders a popup
anchored to the trigger button — exactly the required UX.

**Alternatives considered**:
- shadcn/ui `Popover`: More flexible but requires manual list/menu styling. DropdownMenu
  is pre-styled for menu items (Principle VI).
- Custom portal popup: Rejected — unnecessary complexity.

---

## Decision 8: Theme — Dark Violet CSS Variables

**Decision**: Override the shadcn/ui dark theme CSS variables in `apps/web/src/index.css`
to use the Fluttering brand palette. Add two named custom color tokens (`--radiate`, `--cosmic`)
for use with Tailwind v4's `@theme inline` block.

**Hex to oklch conversions** (computed values):
| Name     | Hex     | oklch approx.          |
|----------|---------|------------------------|
| bg       | #30173d | `oklch(0.16 0.10 307)` |
| radiate  | #e3cee3 | `oklch(0.84 0.04 307)` |
| cosmic   | #de5fe9 | `oklch(0.65 0.21 300)` |

**Strategy**: Override the `.dark` CSS variables to use the violet palette. Since the app
defaults to dark mode (`defaultTheme="dark"` in ThemeProvider), the dark variables are always
active. Light mode variables are also updated to fall back to the dark violet palette to avoid
flash on theme switch.

**Alternatives considered**:
- Separate `.fluttering-theme` CSS class: Rejected — adds complexity. Overriding existing
  variables is simpler and compatible with all shadcn/ui components (Principle VI).
- Inline Tailwind arbitrary values: Rejected — scattered and harder to maintain.

---

## Decision 9: Feature Module Layout

**Decision**: Follow Constitution Principle II exactly. Feature code lives at:
`apps/web/src/features/feature-flags/` with subfolders:
`components/`, `hooks/`, `store/`, `types/`, `utils/`, `index.ts`.

**Rationale**: This is the mandated layout from the constitution. First feature to establish
the pattern for all future features.

**Cross-cutting changes** (shared infrastructure updates, justified):
- `apps/web/src/index.css`: Theme colors — shared across all features, must be global.
- `apps/web/src/routes/__root.tsx`: Layout restructure — Header removed; sidebar-aware
  full-screen layout needed for the feature flags shell.
- `apps/web/src/routes/index.tsx`: Replaced with feature flags render.
These changes touch shared code but are minimal, necessary, and additive-only.

---

## Decision 10: Inline Editing UX Pattern

**Decision**: Inline create/edit rows use uncontrolled inputs with `defaultValue` and
`ref`-based value reads on submit (Enter key or blur). No separate form library needed.

**Rationale**: The inline editing is a lightweight, transient UI — no validation library
overhead is justified for a two-field form. A simple `onKeyDown` (Enter = confirm,
Escape = cancel) pattern is well-established and requires no external dependency.

**Alternatives considered**:
- TanStack Form: Rejected — overkill for a two-field ephemeral form (Principle VI).
- React Hook Form: Rejected — same reasoning as above.

---

## Resolved: No Clarifications Remaining

All decisions are resolved. Implementation can proceed from Phase 1.
