# Tasks: shadcn/ui Complete Component Library Setup

**Input**: Design documents from `/specs/001-install-shadcn/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3)
- Monorepo paths: `apps/web/src/` for frontend, workspace root for pnpm operations

## Path Conventions

**Monorepo (pnpm workspaces)**:
- Frontend components: `apps/web/src/components/ui/`
- Frontend routes: `apps/web/src/routes/`
- Frontend lib: `apps/web/src/lib/`
- App-level CSS: `apps/web/src/index.css`
- Web package manifest: `apps/web/package.json`
- Workspace lock file: `pnpm-lock.yaml`

---

## Phase 1: Setup

**Purpose**: Create a safe rollback point before the destructive overwrite of existing component files.

- [x] T001 Commit current state of `apps/web/src/components/ui/` to branch `001-install-shadcn` as a safety checkpoint: `git add apps/web/src/components/ui/ && git commit -m "chore: snapshot ui components before shadcn full install"`

**Checkpoint**: Safe rollback point established — `git checkout HEAD -- apps/web/src/components/ui/` can undo the overwrite if needed.

---

## Phase 2: Foundational (Component Installation)

**Purpose**: Execute the installation — this single CLI invocation adds all standard shadcn/ui components and resolves all peer dependencies. Must complete before any user story verification can begin.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Run `pnpm shadcn add --all --yes --overwrite` from `apps/web/` to install all standard shadcn/ui components into `apps/web/src/components/ui/` using the configured `base-lyra` style (overwrites existing 8 component files; auto-installs peer dependencies into `apps/web/package.json`)
- [x] T003 Run `pnpm install` from monorepo root to sync the newly added peer dependency entries in `apps/web/package.json` into `pnpm-lock.yaml` and `node_modules`

**Checkpoint**: All component files present in `apps/web/src/components/ui/`; `pnpm-lock.yaml` updated.

---

## Phase 3: User Story 1 — Access the Full Component Library (Priority: P1) 🎯 MVP

**Goal**: Every standard shadcn/ui component is importable from `@/components/ui` and the project builds cleanly.

**Independent Test**: Run `pnpm -F web check-types` — zero errors. Confirm component files exist in `apps/web/src/components/ui/` for accordion, alert, alert-dialog, avatar, badge, breadcrumb, calendar, carousel, collapsible, command, context-menu, dialog, drawer, form, hover-card, input-otp, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, slider, switch, table, tabs, textarea, toggle, toggle-group, tooltip.

### Implementation

- [x] T004 [US1] Run `pnpm -F web check-types` from monorepo root; fix any TypeScript errors in `apps/web/src/` caused by API shape changes in the overwritten components (`button.tsx`, `card.tsx`, `checkbox.tsx`, `dropdown-menu.tsx`, `input.tsx`, `label.tsx`, `skeleton.tsx`, `sonner.tsx`)
- [x] T005 [US1] Audit `apps/web/src/components/ui/` directory listing and confirm all standard shadcn/ui component files are present (accordion.tsx through tooltip.tsx); document any missing components in a comment at the top of `specs/001-install-shadcn/research.md`

**Checkpoint**: `pnpm -F web check-types` exits with zero errors. All component files present. User Story 1 is fully functional.

---

## Phase 4: User Story 2 — Components Render with Consistent Styling (Priority: P2)

**Goal**: All installed components use the project's CSS variables and render consistently in both light and dark modes.

**Independent Test**: Audit 5 newly installed component files for correct use of `cn()` from `@/lib/utils` and CSS variable references. Verify `apps/web/src/index.css` CSS variable definitions are intact after installation.

### Implementation

- [x] T006 [US2] Inspect `apps/web/src/index.css` and confirm the full `:root` and `.dark` CSS variable blocks (--background, --foreground, --primary, --card, --sidebar-*, etc.) and `@import "shadcn/tailwind.css"` directive are still present and unmodified after installation
- [x] T007 [P] [US2] Audit `apps/web/src/components/ui/accordion.tsx`, `apps/web/src/components/ui/dialog.tsx`, and `apps/web/src/components/ui/select.tsx` to confirm each imports `cn` from `@/lib/utils` and applies Tailwind utility classes with CSS variable references (e.g., `bg-background`, `text-foreground`, `border-border`) rather than hardcoded colors
- [x] T008 [P] [US2] Audit `apps/web/src/components/ui/tabs.tsx` and `apps/web/src/components/ui/badge.tsx` to confirm they use `cn` from `@/lib/utils` and CSS variable-based classes consistent with the project theme

**Checkpoint**: `index.css` CSS variables intact. Audited components use `@/lib/utils` `cn()` and CSS variable tokens. User Story 2 verified.

---

## Phase 5: User Story 3 — App Remains Functional After Full Overwrite (Priority: P3)

**Goal**: All existing app pages and interactions work correctly after the overwrite of the 8 pre-existing component files.

**Independent Test**: `pnpm dev:web` starts without errors. The `/login` and `/dashboard` routes render in the browser with no console errors. Form interactions (input, checkbox, button submit) and dropdown menus function correctly.

### Implementation

- [x] T009 [US3] Inspect `apps/web/src/components/sign-in-form.tsx` for prop compatibility with the overwritten `apps/web/src/components/ui/button.tsx`, `apps/web/src/components/ui/input.tsx`, `apps/web/src/components/ui/label.tsx`, and `apps/web/src/components/ui/checkbox.tsx`; update any broken prop usage to match the new component APIs
- [x] T010 [P] [US3] Inspect `apps/web/src/components/sign-up-form.tsx` for prop compatibility with the overwritten UI primitives; update any broken prop usage to match the new component APIs
- [x] T011 [P] [US3] Inspect `apps/web/src/components/user-menu.tsx` and `apps/web/src/components/header.tsx` for prop compatibility with the overwritten `apps/web/src/components/ui/dropdown-menu.tsx` and `apps/web/src/components/ui/button.tsx`; update any broken prop usage
- [x] T012 [P] [US3] Inspect `apps/web/src/components/loader.tsx` and `apps/web/src/routes/dashboard.tsx` for prop compatibility with the overwritten `apps/web/src/components/ui/skeleton.tsx` and `apps/web/src/components/ui/card.tsx`; update any broken prop usage
- [x] T013 [US3] Run `pnpm dev:web`, open `http://localhost:3001`, navigate to `/login` and any dashboard routes; confirm pages render without runtime console errors and that form submit, checkbox toggle, and dropdown menu interactions work as before

**Checkpoint**: All existing pages function correctly. User Stories 1, 2, and 3 are all independently verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Commit the final state and update documentation.

- [x] T014 [P] Commit all installed component files and dependency changes: `git add apps/web/src/components/ui/ apps/web/package.json pnpm-lock.yaml && git commit -m "feat: add all shadcn/ui standard components"`
- [x] T015 [P] Update `specs/001-install-shadcn/spec.md` header field `**Status**: Draft` → `**Status**: Complete`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 checkpoint — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion — can run in parallel with US1 after T003
- **User Story 3 (Phase 5)**: Depends on Phase 3 completion (regression testing needs US1 build to pass)
- **Polish (Phase 6)**: Depends on all user stories complete (T013 verified)

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational — no story dependencies
- **US2 (P2)**: Starts after Foundational — no story dependencies; runs in parallel with US1
- **US3 (P3)**: Starts after US1 is complete (needs clean build from T004)

### Within Each User Story

- T004 before T005 (need types to compile before auditing)
- T006 before T007/T008 (CSS baseline must be confirmed first)
- T009, T010, T011, T012 can run in parallel (different component files)
- T013 after T009–T012 (runtime verification after fixes)

### Parallel Opportunities

- After T003: US1 and US2 phases can proceed in parallel
- Within US3: T009, T010, T011, T012 are all independent file inspections — all parallel [P]
- T014 and T015 in Phase 6 are independent [P]

---

## Parallel Example: User Story 3

```bash
# Launch all consumer inspections in parallel:
Task: "Inspect sign-in-form.tsx for prop compatibility" (T009)
Task: "Inspect sign-up-form.tsx for prop compatibility" (T010)
Task: "Inspect user-menu.tsx and header.tsx for prop compatibility" (T011)
Task: "Inspect loader.tsx and dashboard.tsx for prop compatibility" (T012)
# Then sequentially:
Task: "Run dev server and verify pages render without errors" (T013)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002, T003)
3. Complete Phase 3: User Story 1 (T004, T005)
4. **STOP and VALIDATE**: `pnpm -F web check-types` passes; all component files present
5. This alone satisfies FR-001 through FR-004

### Incremental Delivery

1. Complete Setup + Foundational → Components installed
2. Complete US1 → Build verified, imports work (MVP)
3. Complete US2 → Styling confirmed consistent
4. Complete US3 → Regression-free, production-ready
5. Each phase adds confidence without breaking the previous

### Single-Developer Sequence

```
T001 → T002 → T003 → T004 → T005 → T006 → T007/T008 (parallel) →
T009/T010/T011/T012 (parallel) → T013 → T014/T015 (parallel)
```

---

## Notes

- [P] tasks operate on different files — safe to run concurrently
- [Story] label maps each task to its user story for traceability
- T002 is the only truly destructive operation — T001's checkpoint makes it safe
- If T004 reveals widespread API breakage in existing consumers, complete T009–T012 before attempting T005
- `base-lyra` style means components use `@base-ui/react` — do NOT introduce Radix UI imports
- Rollback: `git checkout HEAD~1 -- apps/web/src/components/ui/ && pnpm install`
