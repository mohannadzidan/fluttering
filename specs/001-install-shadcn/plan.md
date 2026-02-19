# Implementation Plan: shadcn/ui Complete Component Library Setup

**Branch**: `001-install-shadcn` | **Date**: 2026-02-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-install-shadcn/spec.md`

## Summary

Install all standard shadcn/ui UI primitive components into `apps/web/src/components/ui/`, overwriting existing files with fresh defaults, and automatically resolving all peer dependencies. The project already has shadcn configured in `base-lyra` style (which uses `@base-ui/react` primitives instead of Radix UI), so the installed components will follow this style consistently. The entire installation is achieved via a single `shadcn add --all --yes --overwrite` command, followed by a build and regression verification pass.

## Technical Context

**Language/Version**: TypeScript 5.x, strict mode
**Primary Dependencies**: React 19.x, shadcn CLI 3.6.2, `@base-ui/react`, Tailwind CSS v4, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`
**Storage**: N/A
**Testing**: Vitest (unit); Playwright (E2E regression check)
**Target Platform**: Web browser — `apps/web` (Vite + React)
**Project Type**: Monorepo — single frontend target (`apps/web`)
**Performance Goals**: Build must complete without errors; no new bundle size requirement
**Constraints**: Components must use the existing `base-lyra` shadcn style; must be compatible with React 19; must not introduce Radix UI primitives (the project uses `@base-ui/react`)
**Scale/Scope**: ~50+ standard UI primitive components added in one operation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Composition Over Prop Drilling | ✅ Pass | shadcn/ui components are built composition-first by design; no boolean prop proliferation introduced |
| II. Feature-Based Architecture | ✅ Pass | Components land in `apps/web/src/components/ui/` — the designated shared UI primitives location. This is `shared/` intent; no feature-level violation |
| III. Type-Safe API Contract | ✅ Pass | No network communication involved; pure UI library setup |
| IV. State Isolation | ✅ Pass | No state management introduced; UI primitives only |
| V. Test Discipline | ✅ Pass | Regression tested via existing Playwright E2E suite; no new logic to unit-test |
| VI. Simplicity & YAGNI | ✅ Pass | Single CLI command; no abstractions or wrappers introduced |

No violations. Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-install-shadcn/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

> `data-model.md` and `contracts/` are **not applicable** — this feature involves no data entities or API endpoints.

### Source Code (affected paths)

```text
apps/web/
├── src/
│   └── components/
│       └── ui/                    # TARGET — all shadcn component files written here
│           ├── accordion.tsx      # (new)
│           ├── alert.tsx          # (new)
│           ├── alert-dialog.tsx   # (new)
│           ├── aspect-ratio.tsx   # (new)
│           ├── avatar.tsx         # (new)
│           ├── badge.tsx          # (new)
│           ├── breadcrumb.tsx     # (new)
│           ├── button.tsx         # (overwrite)
│           ├── calendar.tsx       # (new)
│           ├── card.tsx           # (overwrite)
│           ├── carousel.tsx       # (new)
│           ├── chart.tsx          # (new — base chart utility, part of standard set)
│           ├── checkbox.tsx       # (overwrite)
│           ├── collapsible.tsx    # (new)
│           ├── command.tsx        # (new)
│           ├── context-menu.tsx   # (new)
│           ├── dialog.tsx         # (new)
│           ├── drawer.tsx         # (new)
│           ├── dropdown-menu.tsx  # (overwrite)
│           ├── form.tsx           # (new)
│           ├── hover-card.tsx     # (new)
│           ├── input.tsx          # (overwrite)
│           ├── input-otp.tsx      # (new)
│           ├── label.tsx          # (overwrite)
│           ├── menubar.tsx        # (new)
│           ├── navigation-menu.tsx# (new)
│           ├── pagination.tsx     # (new)
│           ├── popover.tsx        # (new)
│           ├── progress.tsx       # (new)
│           ├── radio-group.tsx    # (new)
│           ├── resizable.tsx      # (new)
│           ├── scroll-area.tsx    # (new)
│           ├── select.tsx         # (new)
│           ├── separator.tsx      # (new)
│           ├── sheet.tsx          # (new)
│           ├── sidebar.tsx        # (new)
│           ├── skeleton.tsx       # (overwrite)
│           ├── slider.tsx         # (new)
│           ├── sonner.tsx         # (overwrite)
│           ├── switch.tsx         # (new)
│           ├── table.tsx          # (new)
│           ├── tabs.tsx           # (new)
│           ├── textarea.tsx       # (new)
│           ├── toast.tsx          # (new)
│           ├── toaster.tsx        # (new)
│           ├── toggle.tsx         # (new)
│           ├── toggle-group.tsx   # (new)
│           └── tooltip.tsx        # (new)
├── package.json                   # Updated — new peer dependencies added by CLI
└── components.json                # Unchanged — authoritative config preserved
```

**Structure Decision**: Monorepo — only `apps/web` is affected. All component files land in the existing `src/components/ui/` directory per the project's established convention and `components.json` alias configuration.

## Phase 0: Research

*See [research.md](./research.md) for full findings.*

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Installation method | `shadcn add --all --yes --overwrite` | The CLI's `--all` flag is the canonical way to install all registry components in one operation; `--yes` skips prompts; `--overwrite` implements the clarified decision to reset existing files |
| Conflict handling | Overwrite all | Explicitly chosen in clarification Q1 — fresh defaults take priority over any prior customizations |
| Scope | Standard UI primitives only | Chosen in clarification Q2 — chart blocks and page layout blocks excluded |
| Peer dependencies | Auto-installed by CLI | Chosen in clarification Q3 — CLI resolves and installs all required packages |
| Working directory | `apps/web` | `components.json` lives here; CLI reads it automatically |
| Style | `base-lyra` (unchanged) | Existing `components.json` config is authoritative; the CLI reads it and adds components in the correct style |
| Safety checkpoint | Git commit before run | Overwrite is destructive — a pre-run commit enables easy rollback |

### Style Architecture Note

The project uses shadcn's `base-lyra` style (set in `components.json`). This style generates components backed by `@base-ui/react` primitives rather than Radix UI. This is why existing components like `button.tsx` import from `@base-ui/react/button` and `dropdown-menu.tsx` imports from `@base-ui/react/menu`. All newly added components will follow the same pattern — the shadcn CLI respects the configured style automatically.

### Peer Dependency Expectations

The CLI will add packages to `apps/web/package.json` as needed. Based on the `base-lyra` style and standard components, likely additions include:
- `embla-carousel-react` (Carousel component)
- `input-otp` (InputOTP component)
- `react-day-picker` (Calendar component)
- `vaul` (Drawer component)
- `cmdk` (Command component)
- Potentially others — the CLI resolves these automatically

## Phase 1: Design & Contracts

### Data Model

Not applicable. This feature introduces no new data entities, database schemas, or persistent state.

### API Contracts

Not applicable. This feature introduces no new tRPC procedures, REST endpoints, or network communication.

### Quickstart

*See [quickstart.md](./quickstart.md) for developer guide.*

### Regression Risk Assessment

The overwrite of 8 existing components carries regression risk. Components currently in use by the app:

| Component | Used in | Risk |
|-----------|---------|------|
| `button.tsx` | sign-in form, sign-up form, user-menu, header | **High** — custom `@base-ui` wrapper with project-specific variants |
| `dropdown-menu.tsx` | user-menu | **Medium** — base-ui backed, may change API shape |
| `card.tsx` | login route, dashboard | **Low** — structural only |
| `input.tsx` | sign-in form, sign-up form | **Medium** — used in form submissions |
| `checkbox.tsx` | sign-in form | **Low** |
| `label.tsx` | sign-in form, sign-up form | **Low** |
| `skeleton.tsx` | loader component | **Low** |
| `sonner.tsx` | root layout | **Low** — toast wrapper |

Post-installation regression testing MUST cover: login page, sign-up page, dashboard page, dropdown menus, and form interactions.

## Post-Phase 1 Constitution Check

All six principles still pass. The regression risk table above confirms no architectural violations are introduced. Component files remain in the designated primitives location. No new abstractions, stores, or API surface are introduced.
