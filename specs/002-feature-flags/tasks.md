# Tasks: Feature Flags Management UI

**Input**: Design documents from `/specs/002-feature-flags/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tests**: Vitest unit tests included for the `format-time` utility (mandated by constitution for pure functions). Playwright E2E tasks in Polish phase (constitution mandates for critical journeys).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Paths follow monorepo layout: `apps/web/src/features/feature-flags/`

## Path Conventions

**Monorepo (pnpm workspaces)**:
- Feature module: `apps/web/src/features/feature-flags/`
- Shared routes: `apps/web/src/routes/`
- Global styles: `apps/web/src/index.css`

---

## Phase 1: Setup

**Purpose**: Install the one missing dependency and scaffold the feature directory structure.

- [x] T001 Install Zustand in the web app: run `pnpm --filter web add zustand` from repo root
- [x] T002 Create the feature directory tree: `apps/web/src/features/feature-flags/` with subfolders `components/sidebar/`, `components/flag-list/`, `hooks/`, `store/`, `types/`, `utils/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure — types, store, theme, and layout skeleton — that MUST be complete before any user story can render.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 [P] Create all TypeScript types, interfaces, and seed data constants in `apps/web/src/features/feature-flags/types/index.ts` — define `FlagType`, `FlagValue<T>`, `FeatureFlag<T>`, `BooleanFlag`, `AnyFlag`, `Project`, `FeatureFlagsState`, `FeatureFlagsActions`, `FeatureFlagsStore`, `SEED_PROJECTS`, `SEED_FLAGS` (see `contracts/store-contract.ts` for the full definition)
- [x] T004 [P] Create timestamp formatting utility in `apps/web/src/features/feature-flags/utils/format-time.ts` — export `formatFlagTime(date: Date): string` returning "just now" (< 1 min), "X min ago" (< 1 hr), "X hr ago" (< 24 hr), or "MMM d, yyyy" (≥ 1 day) using `date-fns`
- [x] T005 [P] Apply dark violet brand theme by overriding CSS variables in `apps/web/src/index.css` — replace the entire `.dark {}` block with Fluttering brand palette (`--background: oklch(0.16 0.10 307)`, `--foreground: oklch(0.84 0.04 307)`, `--primary: oklch(0.65 0.21 300)`, sidebar variables, etc.) and add `--color-radiate` and `--color-cosmic` tokens to the `@theme inline {}` block (see `quickstart.md` Step 5 for the full CSS)
- [x] T006 Create Zustand store in `apps/web/src/features/feature-flags/store/index.ts` — export `useFeatureFlagsStore` created with `create<FeatureFlagsStore>()` implementing all actions: `selectProject`, `setSidebarOpen`, `addFlag`, `updateFlag`, `toggleFlagValue`, `deleteFlag`, initialized with `SEED_PROJECTS` and `SEED_FLAGS` (depends on T003)
- [x] T007 Create typed selector hooks in `apps/web/src/features/feature-flags/hooks/use-flags-store.ts` — export `useSelectedProject()`, `useProjectFlags()`, `useProjects()`, `useSidebarOpen()` as thin wrappers around `useFeatureFlagsStore` with stable selectors (depends on T003, T006)
- [x] T008 Create the `FlagsLayout` skeleton component in `apps/web/src/features/feature-flags/components/flags-layout.tsx` — render `<SidebarProvider>` wrapping an empty `<Sidebar>` (placeholder) and `<SidebarInset>` with a `<main>` content area; no feature content yet — just the structural shell (depends on T006, T007)
- [x] T009 [P] Modify `apps/web/src/routes/__root.tsx` — remove the `<Header />` import and usage; change the outer `<div>` to `className="h-svh"` (full height, no grid rows) so that `<FlagsLayout>` can control its own internal layout via flexbox
- [x] T010 Modify `apps/web/src/routes/index.tsx` — replace the entire health-check placeholder with a single import and render of `<FlagsLayout />` from the feature's public `index.ts` (depends on T008)
- [x] T011 Create the feature's public API file `apps/web/src/features/feature-flags/index.ts` — export only `FlagsLayout` (the sole public surface of this feature module) (depends on T008)

**Checkpoint**: Run `pnpm --filter web dev`. The app should load at `localhost:5173` with the dark violet background and no visible content in the main area yet (sidebar placeholder present).

---

## Phase 3: User Story 1 — View and Toggle Feature Flags (Priority: P1) 🎯 MVP

**Goal**: Display all flags for the selected project in a list. Each row shows name, type icon, toggle switch, creation timestamp, update timestamp, and a menu button placeholder. Toggling a boolean flag flips its value and refreshes the updated timestamp.

**Independent Test**: Load the app → see the seeded flags listed → click a toggle → observe it flip and the "updated" time change.

- [x] T012 [P] [US1] Create `FlagTypeIcon` component in `apps/web/src/features/feature-flags/components/flag-type-icon.tsx` — accept `type: FlagType` and `className?: string` props; render `<ToggleRight>` from `lucide-react` for `"boolean"` (switch statement, ready for future types); size the icon at 16px by default
- [x] T013 [P] [US1] Create `FlagRow` component in `apps/web/src/features/feature-flags/components/flag-list/flag-row.tsx` — render a single flag as a horizontal flex row with: flag `name` (text, truncate with `truncate max-w-[200px]`), `<FlagTypeIcon>`, a flexible spacer (`flex-1`), a shadcn `<Switch>` bound to `flag.value` calling `toggleFlagValue` on change, a `<CalendarPlus>` icon + `formatFlagTime(flag.createdAt)`, a `<CalendarClock>` icon + `formatFlagTime(flag.updatedAt)`, and a `<MoreHorizontal>` icon button placeholder (menu not wired yet); use Tailwind `text-radiate` for secondary text, `text-cosmic` for the type icon (depends on T003, T004, T012)
- [x] T014 [US1] Create `FlagList` component in `apps/web/src/features/feature-flags/components/flag-list/flag-list.tsx` — use `useProjectFlags()` hook to get the current project's flags; render a `<ul>` of `<FlagRow>` items; if the list is empty render an empty-state `<div>` with message "No flags yet" and a sub-message "Click 'Add new flag...' to create your first flag"; no "Add" button yet (added in US2) (depends on T007, T013)
- [x] T015 [US1] Wire `FlagList` into `FlagsLayout` by replacing the empty `<main>` placeholder in `apps/web/src/features/feature-flags/components/flags-layout.tsx` with `<FlagList />` inside the `<SidebarInset>` (depends on T008, T014)

**Checkpoint**: Load the app → the seeded flags ("dark-mode" ON, "new-checkout" OFF) appear as rows → click the "dark-mode" switch → it flips to OFF → the "updated" timestamp reads "just now".

---

## Phase 4: User Story 2 — Inline Flag Creation (Priority: P2)

**Goal**: An "Add new flag..." button at the bottom of the flag list opens an inline creation row. The user types a name, confirms with Enter, and the new flag appears in the list with default value `false`.

**Independent Test**: Click "Add new flag..." → type "my-feature" → press Enter → a new row appears with a `false` toggle. Press Escape instead → no row is added.

- [x] T016 [US2] Create `FlagCreateRow` component in `apps/web/src/features/feature-flags/components/flag-list/flag-create-row.tsx` — render an inline form row with: an uncontrolled text `<input>` auto-focused on mount for the flag name (placeholder "Flag name..."), a `<select>` or type selector showing "Boolean" (only option for now), and a hidden confirm action on Enter / cancel on Escape; on Enter: trim name, if empty highlight input with red ring and return, else call `addFlag(projectId, name, "boolean")` and invoke `onDone()` callback; on Escape: invoke `onCancel()` callback; accept `projectId: string`, `onDone: () => void`, `onCancel: () => void` props (depends on T003, T006)
- [x] T017 [US2] Update `FlagList` in `apps/web/src/features/feature-flags/components/flag-list/flag-list.tsx` — add local `isCreating: boolean` state defaulting to `false`; render `<FlagCreateRow>` after all `<FlagRow>` items when `isCreating` is `true`, keyed by `selectedProjectId` so switching projects resets the row; add the "Add new flag..." `<button>` at the bottom (below rows, above any empty state) that sets `isCreating = true`; `FlagCreateRow`'s `onDone` and `onCancel` both set `isCreating = false` (depends on T014, T016)

**Checkpoint**: Click "Add new flag..." → type "release-banner" → Enter → new row appears at bottom with `false` toggle and "just now" timestamps. Click "Add new flag..." again → press Escape → no row added. Click "Add new flag..." → press Enter immediately → input gets a red ring, no flag created.

---

## Phase 5: User Story 3 — Edit or Delete a Flag (Priority: P3)

**Goal**: Each flag row has a menu icon button. Clicking it opens a dropdown with "Edit" and "Delete". Edit puts the row into inline edit mode (same-row). Delete removes the flag immediately.

**Independent Test**: Click the `⋯` menu on any flag → click "Delete" → row disappears. Click the menu again → click "Edit" → row becomes editable → change name → Enter → row shows new name.

- [x] T018 [P] [US3] Create `FlagMenu` component in `apps/web/src/features/feature-flags/components/flag-list/flag-menu.tsx` — render a shadcn `<DropdownMenu>` triggered by a `<MoreHorizontal>` icon `<Button variant="ghost" size="icon">`; menu items: "Edit" (calls `onEdit()`) and "Delete" (calls `onDelete()`, styled destructive); accept props `onEdit: () => void` and `onDelete: () => void`
- [x] T019 [P] [US3] Create `FlagEditRow` component in `apps/web/src/features/feature-flags/components/flag-list/flag-edit-row.tsx` — same visual layout as `FlagRow` but name and type are editable inline (uncontrolled inputs pre-filled with `defaultValue`); on Enter: trim name, if empty show red ring and return, else call `updateFlag(projectId, flagId, { name, type })` then invoke `onDone()`; on Escape: invoke `onCancel()` without saving; accept `flag: AnyFlag`, `projectId: string`, `onDone: () => void`, `onCancel: () => void` props (depends on T003, T012)
- [x] T020 [US3] Integrate `FlagMenu` into `FlagRow` and `FlagEditRow` into `FlagList` in the relevant files — in `FlagRow` (`apps/web/src/features/feature-flags/components/flag-list/flag-row.tsx`): replace the `<MoreHorizontal>` placeholder button with `<FlagMenu onEdit={onEdit} onDelete={onDelete} />`; add `onEdit: () => void` and `onDelete: () => void` props to `FlagRow`; in `FlagList` (`apps/web/src/features/feature-flags/components/flag-list/flag-list.tsx`): add `editingFlagId: string | null` state; render `<FlagEditRow>` in place of `<FlagRow>` for the flag whose `id === editingFlagId`; pass `onEdit={() => setEditingFlagId(flag.id)}` and `onDelete={() => deleteFlag(projectId, flag.id)}` to each `FlagRow` (depends on T013, T014, T018, T019)

**Checkpoint**: Seeded flags visible → click `⋯` on "new-checkout" → "Delete" → row removed → click `⋯` on "dark-mode" → "Edit" → rename to "dark-mode-v2" → Enter → row shows new name with refreshed timestamp.

---

## Phase 6: User Story 4 — Collapsible Sidebar Navigation (Priority: P4)

**Goal**: The sidebar shows the Fluttering logo, a project selector dropdown, and a divider. Clicking the sidebar trigger collapses it. Selecting a different project switches the flags panel to that project's flags.

**Independent Test**: Load app → sidebar shows "fluttering" logo + "Production" selected in dropdown + seeded flags visible → click sidebar trigger (or Cmd+B) → sidebar collapses, flags panel expands → select "Staging" in dropdown → flags panel switches to Staging's flag ("beta-dashboard").

- [x] T021 [P] [US4] Create `ProjectSelector` component in `apps/web/src/features/feature-flags/components/sidebar/project-selector.tsx` — render a shadcn `<Select>` component populated from `useProjects()` hook; call `selectProject(id)` on value change; show the selected project name as the current value; style the trigger with `bg-sidebar text-sidebar-foreground` to blend into the sidebar
- [x] T022 [US4] Create `FlagsSidebar` component in `apps/web/src/features/feature-flags/components/sidebar/flags-sidebar.tsx` — compose shadcn `<Sidebar>` with: a `<SidebarHeader>` containing the "fluttering" wordmark (text-based logo, `font-bold text-xl text-radiate`), a `<SidebarContent>` section containing `<ProjectSelector />` and a `<SidebarSeparator />` below it, and a `<SidebarTrigger>` collapse button positioned at the top of the sidebar (depends on T021)
- [x] T023 [US4] Replace the empty sidebar placeholder in `FlagsLayout` with `<FlagsSidebar />` in `apps/web/src/features/feature-flags/components/flags-layout.tsx` — ensure `<SidebarTrigger>` is also rendered inside the `<SidebarInset>` header area as a secondary entry point per shadcn sidebar conventions (depends on T008, T022)

**Checkpoint**: Load app → full sidebar visible with "fluttering" logo, "Production" dropdown, divider, and flags panel with seeded flags → click trigger → sidebar collapses → flags panel fills full width → click trigger again → sidebar re-expands → change dropdown to "Staging" → only "beta-dashboard" flag shown.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, test coverage, and final validation.

- [ ] T024 [P] Add Vitest unit tests for `formatFlagTime` in `apps/web/src/features/feature-flags/utils/format-time.test.ts` — cover: < 1 min (expect "just now"), 5 min ago, 1 hr ago, 20 hr ago, and 2 days ago (expect absolute date like "Feb 17, 2026"); import `vi.setSystemTime` for deterministic time
- [ ] T025 [P] Add `<Tooltip>` on the flag name in `FlagRow` (`apps/web/src/features/feature-flags/components/flag-list/flag-row.tsx`) — wrap the truncated name `<span>` in a shadcn `<TooltipProvider><Tooltip><TooltipTrigger>` showing the full name on hover
- [ ] T026 [P] Add `aria-label` attributes to icon-only interactive elements in `FlagRow` and `FlagMenu` — the `<Switch>` should have `aria-label={\`Toggle \${flag.name}\`}`; the menu trigger button should have `aria-label="Flag options"`; verify natural tab order: name → Switch → menu button
- [ ] T027 Add Playwright E2E test file `apps/web/e2e/feature-flags.spec.ts` — implement the 8 test scenarios from `plan.md` Testing Plan: toggle flag, create flag (valid), create flag (empty name), delete flag, edit flag name, escape creation, collapse sidebar, switch project
- [ ] T028 Run final validation: `pnpm --filter web check-types && pnpm lint` — fix any type errors or lint warnings; confirm no `any` types introduced; confirm all imports use `@/` alias within the feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Foundational ✅
- **US2 (Phase 4)**: Depends on US1 (FlagList must exist to extend it)
- **US3 (Phase 5)**: Depends on US1 (FlagRow must exist to extend it); independent of US2
- **US4 (Phase 6)**: Depends on Foundational only (FlagsLayout shell exists); independent of US1–US3
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

```
Phase 1 → Phase 2 (Foundational)
                 ├──▶ US1 (Phase 3) ──▶ US2 (Phase 4)
                 │                  ╲
                 │                   ──▶ US3 (Phase 5)
                 └──▶ US4 (Phase 6) [independent of US1/2/3]
```

### Within Each Phase

- Tasks marked [P] within the same phase can run simultaneously
- T003 and T004 are parallel (different files, no shared dependency)
- T005 and T009 are parallel (different files)
- T012 and T013 are parallel (different files, both depend on T003/T004/T012's deps)
- T018 and T019 are parallel (different files)
- T021 can run in parallel with T018/T019
- T024, T025, T026, T027 are all parallel (different files)

---

## Parallel Execution Examples

### Phase 2 — Foundational (parallel groups)

```bash
# Group A (start immediately, parallel):
Task: "T003 Create types/index.ts"
Task: "T004 Create format-time.ts"
Task: "T005 Apply dark theme CSS to index.css"
Task: "T009 Modify __root.tsx"

# Group B (after T003):
Task: "T006 Create Zustand store"
Task: "T007 Create selector hooks"

# Group C (after T006, T007):
Task: "T008 Create FlagsLayout skeleton"
→ Then T010, T011 (after T008)
```

### Phase 3 — US1 (parallel then sequential)

```bash
# Start in parallel:
Task: "T012 Create FlagTypeIcon component"
Task: "T013 Create FlagRow component"

# After T012 + T013:
Task: "T014 Create FlagList component"

# After T014:
Task: "T015 Wire FlagList into FlagsLayout"
```

### Phase 5 — US3 (parallel then sequential)

```bash
# Start in parallel:
Task: "T018 Create FlagMenu component"
Task: "T019 Create FlagEditRow component"

# After T018 + T019:
Task: "T020 Integrate FlagMenu and FlagEditRow into FlagRow/FlagList"
```

### Phase 7 — Polish (fully parallel)

```bash
# All can run simultaneously:
Task: "T024 Vitest tests for format-time.ts"
Task: "T025 Tooltip on flag name in FlagRow"
Task: "T026 aria-label accessibility fixes"
Task: "T027 Playwright E2E tests"
```

---

## Implementation Strategy

### MVP First (US1 Only — ~10 tasks)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T011)
3. Complete Phase 3: US1 (T012–T015)
4. **STOP and VALIDATE**: App loads with dark violet theme, seeded flags visible, toggles work
5. Demo / checkpoint

### Incremental Delivery

1. **Foundation** (T001–T011) → Dark app shell renders
2. **+US1** (T012–T015) → Flags visible, toggleable ← **Demo-able MVP**
3. **+US2** (T016–T017) → Flags can be created inline
4. **+US3** (T018–T020) → Flags can be edited and deleted
5. **+US4** (T021–T023) → Sidebar polished with logo + project switching
6. **+Polish** (T024–T028) → Tests, accessibility, type safety

Each step is independently verifiable and builds on the previous without breaking it.

### Single-Developer Suggested Order

T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → **[CHECKPOINT]** → T012 → T013 → T014 → T015 → **[DEMO MVP]** → T016 → T017 → T018 → T019 → T020 → T021 → T022 → T023 → T024 → T025 → T026 → T027 → T028

---

## Task Count Summary

| Phase | Tasks | Story | Parallelizable |
|-------|-------|-------|----------------|
| Phase 1: Setup | 2 | — | 0 |
| Phase 2: Foundational | 9 | — | 4 |
| Phase 3: US1 (P1) | 4 | US1 | 2 |
| Phase 4: US2 (P2) | 2 | US2 | 0 |
| Phase 5: US3 (P3) | 3 | US3 | 2 |
| Phase 6: US4 (P4) | 3 | US4 | 1 |
| Phase 7: Polish | 5 | — | 4 |
| **Total** | **28** | | **13** |

---

## Notes

- [P] tasks = different files, no blocking dependencies — safe to run in parallel
- [US*] label maps each task to a user story for traceability and independent testing
- Each story phase ends with a concrete **Checkpoint** describing what to verify in the browser
- The `formatFlagTime` utility test (T024) MUST pass before the Polish phase is considered complete
- Avoid importing across feature boundaries — use only `apps/web/src/features/feature-flags/index.ts` as the public API from `routes/index.tsx`
- All inline style props are forbidden (constitution) — use Tailwind utilities only; `text-radiate` and `text-cosmic` will be available after T005
