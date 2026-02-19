# Tasks: Nested Flag Groups

**Input**: Design documents from `/specs/003-flag-groups/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/store-actions.md ✅ quickstart.md ✅

**Tests**: Vitest unit tests are constitutionally mandated (Principle V) for all pure utility functions. Playwright e2e tests are constitutionally mandated for critical user journeys. Both are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks in same phase)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Monorepo paths: `apps/web/src/features/feature-flags/` for all feature code

## Path Conventions

- **Monorepo (pnpm workspaces)**: `apps/web/src/features/feature-flags/`
- Feature types: `apps/web/src/features/feature-flags/types/index.ts`
- Feature store: `apps/web/src/features/feature-flags/store/index.ts`
- Feature utils: `apps/web/src/features/feature-flags/utils/`
- Feature components: `apps/web/src/features/feature-flags/components/flag-list/`
- Feature hooks: `apps/web/src/features/feature-flags/hooks/use-flags-store.ts`
- Vitest unit tests: co-located as `*.test.ts` alongside the source file
- Playwright e2e tests: `apps/web/e2e/feature-flags/flag-groups.spec.ts`

---

## Phase 1: Setup

**Purpose**: Install the new drag-and-drop dependency before any source changes.

- [x] T001 Install `@dnd-kit/core` and `@dnd-kit/utilities` by running `pnpm --filter web add @dnd-kit/core @dnd-kit/utilities` from repo root

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data-model and store changes that EVERY user story depends on. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: Complete in order T002 → T003 → T004 → T005 → T006; T007 and T008 can run in parallel with T003–T006.

- [x] T002 Add `parentId: string | null` field to `FeatureFlag<T>` interface and update all `SEED_FLAGS` entries to include `parentId: null` in `apps/web/src/features/feature-flags/types/index.ts`
- [x] T003 Add `collapsedFlagIds: Set<string>` to `FeatureFlagsState` (initial value: `new Set()`) and add `toggleFlagCollapsed(flagId: string): void` action to `useFeatureFlagsStore` in `apps/web/src/features/feature-flags/store/index.ts`
- [x] T004 Add `setFlagParent(projectId: string, flagId: string, parentId: string | null): void` action to `useFeatureFlagsStore` — include pre-condition guards: target parent must exist and be boolean, cycle detection via ancestor walk — in `apps/web/src/features/feature-flags/store/index.ts`
- [x] T005 Update `deleteFlag` action in `useFeatureFlagsStore` to promote direct children to root (set `parentId = null` for all flags whose `parentId === deletedFlagId`) and remove `flagId` from `collapsedFlagIds` in `apps/web/src/features/feature-flags/store/index.ts`
- [x] T006 Update `updateFlag` action in `useFeatureFlagsStore` to guard against changing `type` away from `"boolean"` when `getDirectChildren(flags[projectId], flagId).length > 0` — reject silently if violated — in `apps/web/src/features/feature-flags/store/index.ts`
- [x] T007 [P] Create `apps/web/src/features/feature-flags/utils/flag-tree.ts` with three exported pure functions: `buildRenderList(flags: AnyFlag[], collapsedFlagIds: Set<string>): FlagRenderNode[]` (depth-first tree walk, skips collapsed subtrees, produces flat ordered array with `depth`, `isLastChild`, `hasChildren`, `ancestorIsLastChild[]` per node), `getDirectChildren(flags: AnyFlag[], parentId: string): AnyFlag[]`, and `hasDescendant(flags: AnyFlag[], ancestorId: string, targetId: string): boolean`
- [x] T008 [P] Add `useCollapsedFlagIds(): Set<string>` custom hook to `apps/web/src/features/feature-flags/hooks/use-flags-store.ts`
- [x] T009 Create `apps/web/src/features/feature-flags/utils/flag-tree.test.ts` with Vitest unit tests covering: `buildRenderList` empty list, single root, single parent+child (depth/isLastChild), multi-child (connector variants), 3-level nesting (ancestorIsLastChild), collapsed parent hides children; `getDirectChildren` basic and empty cases; `hasDescendant` direct child, grandchild, unrelated flag, circular safety

**Checkpoint**: Type system compiles, store has all hierarchy actions, tree utilities are tested ✅

---

## Phase 3: User Story 1 — View Flags in a Parent-Child Hierarchy (Priority: P1) 🎯 MVP

**Goal**: The flag list renders a visual tree with dashed CSS elbow connectors between parent and child rows at any nesting depth.

**Independent Test**: Seed or create a boolean parent flag with two children and one grandchild. Open the flags page — children appear indented below the parent; connectors render correctly at both levels. No interaction required to see this.

- [ ] T010 [P] [US1] Create `apps/web/src/features/feature-flags/components/flag-list/flag-connector.tsx` — renders absolutely-positioned dashed CSS elbow connector using Tailwind `border-l border-b border-dashed`; props: `depth: number`, `isLastChild: boolean`, `ancestorIsLastChild: boolean[]`; last-child variant clips the vertical line at the branch; non-last-child variant continues the vertical line; renders one ancestor continuation line per ancestor level where `ancestorIsLastChild[i] === false`
- [ ] T011 [US1] Update `apps/web/src/features/feature-flags/components/flag-list/flag-row.tsx` to accept new props `depth: number`, `hasChildren: boolean`, `isLastChild: boolean`, `ancestorIsLastChild: boolean[]`, `isCollapsed: boolean`, `onAddChild: () => void`, `onDetach: () => void`, `onToggleCollapse: () => void`, `onMoveTo: (parentId: string) => void`; add relative positioning wrapper to accommodate `FlagConnector`; render `<FlagConnector>` when `depth > 0`; add horizontal indentation (`depth * indentUnit` px via inline style — dynamic value, Tailwind cannot express)
- [ ] T012 [US1] Update `apps/web/src/features/feature-flags/components/flag-list/flag-list.tsx` to replace the flat `flags.map()` with `buildRenderList(flags, collapsedFlagIds)` and pass `depth`, `hasChildren`, `isLastChild`, `ancestorIsLastChild`, `isCollapsed` from each `FlagRenderNode` to the corresponding `FlagRow`

**Checkpoint**: Flag list renders tree with connectors when seed data has `parentId` set. US1 is independently verifiable by inspecting the DOM ✅

---

## Phase 4: User Story 2 — Assign a Child Flag to a Boolean Parent (Priority: P1)

**Goal**: Users can assign a new or existing flag as a child of a boolean parent via drag-and-drop (primary) and the "Move to…" context-menu picker (fallback). Users can also directly reparent a child from one parent to another.

**Independent Test**: Create two boolean flags (Parent A, Parent B) and two plain flags. Drag Flag 1 onto Parent A — it appears as a child. Open Flag 2's menu → "Move to…" → select Parent A → Flag 2 appears under Parent A. Drag Flag 1 onto Parent B — it moves from A to B in one action.

- [ ] T013 [P] [US2] Create `apps/web/src/features/feature-flags/components/flag-list/flag-move-to-menu.tsx` — a Popover + Command (shadcn/ui combobox) that lists eligible boolean parent flags as searchable options; props: `candidates: AnyFlag[]`, `onSelect: (parentId: string) => void`; check/install shadcn `popover` and `command` components via `pnpm dlx shadcn@latest add popover command` if not already present
- [ ] T014 [P] [US2] Update `apps/web/src/features/feature-flags/components/flag-list/flag-create-row.tsx` to accept an optional `parentId?: string | null` prop and pass it to the `addFlag` store call so new flags can be created as children
- [ ] T015 [US2] Update `apps/web/src/features/feature-flags/components/flag-list/flag-menu.tsx` to: add "Add child flag" item (visible only when `flag.type === "boolean"`) calling `onAddChild`; add "Move to…" item (all flags) rendering `FlagMoveToMenu` with pre-filtered `candidates`; add "Detach from parent" item (visible only when `flag.parentId !== null`) calling `onDetach`; pass new props `onAddChild`, `onDetach`, `onMoveTo`, `projectFlags`, `flag` into the component
- [ ] T016 [US2] Update `apps/web/src/features/feature-flags/components/flag-list/flag-row.tsx` to add `@dnd-kit/core` drag hooks: `useDraggable({ id: flag.id })` and `useDroppable({ id: flag.id, disabled: flag.type !== "boolean" })`; apply `CSS.Transform.toString(transform)` as an inline `style` when dragging (dynamic — must be inline); merge drag and drop refs onto the row container
- [ ] T017 [US2] Update `apps/web/src/features/feature-flags/components/flag-list/flag-list.tsx` to: wrap the row list in `<DndContext onDragEnd={handleDragEnd}>`; implement `handleDragEnd` to call `setFlagParent` when a valid drop occurs (target is boolean, not a descendant of dragged flag); wire `onAddChild` to set inline-create state with `parentId`; wire `onMoveTo` to call `setFlagParent(projectId, flagId, parentId)`

**Checkpoint**: Assign via drag-and-drop and "Move to…" menu both work. Direct reparenting A→B works in one action ✅

---

## Phase 5: User Story 3 — Create a Multi-Level Nested Hierarchy (Priority: P2)

**Goal**: A flag at any depth that is boolean can itself have children. The connector and indentation system renders correctly for grandparent → parent → grandchild hierarchies.

**Independent Test**: Create boolean flag A (root) → add boolean child B under A → add child C under B. Confirm 3-level indentation, correct connector at each level, and ancestor vertical lines visible alongside C.

- [ ] T018 [US3] Write Playwright e2e tests in `apps/web/e2e/feature-flags/flag-groups.spec.ts` for US3 acceptance scenarios: create 3-level hierarchy via menu; verify indentation increases at each level; verify connector at depth 1 (A→B) and depth 2 (B→C); verify ancestor line visible at depth 2; verify adding to depth N+1 does not break depth N connectors

**Checkpoint**: Multi-level nesting visually correct and covered by e2e tests ✅

---

## Phase 6: User Story 4 — Remove a Flag from a Group (Priority: P2)

**Goal**: Users can detach a child flag back to root level. A flag carrying its own children moves with those children. Parent deletion promotes direct children to root.

**Independent Test**: With a 2-level hierarchy (A → B → C, where B is boolean with child C): (1) detach B from A — B+C appear at root; (2) delete A — no children deleted; (3) detach C from B — C appears at root.

- [ ] T019 [US4] Wire `onDetach` callback in `apps/web/src/features/feature-flags/components/flag-list/flag-list.tsx` to call `setFlagParent(projectId, flag.id, null)` — the "Detach from parent" menu item (added in T015) uses this callback; verify the parent's connector disappears when its last child is detached
- [ ] T020 [US4] Write Playwright e2e tests in `apps/web/e2e/feature-flags/flag-groups.spec.ts` for US4 acceptance scenarios: detach child → appears at root with no connector; detach only child → parent loses connector; detach middle node (B from A) → B and C move together to root; delete parent → children promoted (not deleted)

**Checkpoint**: Detach and parent-delete behaviors correct and tested ✅

---

## Phase 7: User Story 5 — Collapse and Expand a Parent Flag's Children (Priority: P2)

**Goal**: A collapse/expand toggle (ChevronDown/ChevronRight) appears as a `FlagElementContainer` immediately after the name container on any parent flag row. Clicking it hides or reveals the entire subtree.

**Independent Test**: With a 3-level hierarchy (A → B → C, B boolean): click A's collapse toggle → B and C disappear; click toggle again → B reappears but C stays hidden (B's collapsed state preserved); click B's toggle → C reappears.

- [ ] T021 [US5] Update `apps/web/src/features/feature-flags/components/flag-list/flag-row.tsx` to render a `FlagElementContainer` with a Lucide `ChevronDown` (expanded) or `ChevronRight` (collapsed) icon immediately after the name `FlagElementContainer`; this element is only rendered when `hasChildren === true`; clicking it calls `onToggleCollapse()`
- [ ] T022 [US5] Update `apps/web/src/features/feature-flags/components/flag-list/flag-list.tsx` to read `collapsedFlagIds` from the store via `useCollapsedFlagIds()`; pass `isCollapsed={collapsedFlagIds.has(flag.id)}` to each `FlagRow`; wire `onToggleCollapse` to call `toggleFlagCollapsed(flag.id)` from the store
- [ ] T023 [US5] Write Playwright e2e tests in `apps/web/e2e/feature-flags/flag-groups.spec.ts` for US5 acceptance scenarios: collapse parent → all descendants hidden; expand → direct children visible; grandchildren remain hidden if their parent was also collapsed; new child added to collapsed parent stays hidden; toggle indicator reflects state

**Checkpoint**: Collapse/expand fully functional with sub-parent state preservation ✅

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Type safety, UI guard for type-change, and final validation pass.

- [ ] T024 [P] Disable the type selector in `apps/web/src/features/feature-flags/components/flag-list/flag-edit-row.tsx` when the flag being edited has children (call `getDirectChildren` from `flag-tree.ts`); add a tooltip or helper text explaining the type cannot be changed while children exist
- [ ] T025 [P] Run `pnpm --filter web tsc --noEmit` and fix any TypeScript strict-mode errors introduced by the `parentId`, `collapsedFlagIds`, or new prop changes
- [ ] T026 [P] Run `pnpm --filter web test` (Vitest) and confirm `flag-tree.test.ts` passes; fix any test failures
- [ ] T027 Run the quickstart.md verification checklist (items 1–15) manually against the running app and fix any issues found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — MVP deliverable
- **US2 (Phase 4)**: Depends on Phase 3 — builds on tree rendering
- **US3 (Phase 5)**: Depends on Phase 4 — validates multi-level using US1+US2
- **US4 (Phase 6)**: Depends on Phase 4 (FlagMenu "Detach" from T015) — can run in parallel with US3
- **US5 (Phase 7)**: Depends on Phase 3 (FlagRow structure from T011) — can run in parallel with US3/US4 after Phase 3
- **Polish (Phase 8)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: Depends on Foundation only — first MVP increment
- **US2 (P1)**: Depends on US1 (T011 FlagRow, T012 FlagList) — second MVP increment
- **US3 (P2)**: Depends on US1 + US2 — no new source changes, only e2e test validation
- **US4 (P2)**: Depends on US2 (T015 FlagMenu "Detach" item) — can run in parallel with US3
- **US5 (P2)**: Depends on US1 (T011 FlagRow structure) — can run in parallel with US3/US4

### Within Each Phase: Execution Order

```
Phase 2: T002 → [T003 → T004 → T005 → T006] (store sequential)
                [T007]                         (parallel, new file)
                [T008]                         (parallel, different file)
         T009 after T007

Phase 3: T010 (parallel, new file)
         T011 after T010
         T012 after T011

Phase 4: [T013, T014] (parallel, different new files)
         T015 after T013
         T016 after Phase 3 T011
         T017 after T015 + T016

Phase 7: T021 → T022 → T023
```

### Parallel Opportunities

- T007 (flag-tree.ts) runs in parallel with T003–T006 (store/index.ts)
- T008 (hooks) runs in parallel with T003–T007
- T010 (FlagConnector new file) runs in parallel within Phase 3
- T013 (FlagMoveToMenu new file) and T014 (FlagCreateRow) run in parallel in Phase 4
- After Phase 2: US3, US4, US5 can all start once US1+US2 are done (or be worked by different developers)
- T024, T025, T026 in Polish are parallel (different commands/files)

---

## Parallel Example: Phase 2 Foundational

```
Stream A (store changes, sequential):
  T002 → T003 → T004 → T005 → T006

Stream B (utilities, parallel with Stream A after T002):
  T002 → T007 → T009

Stream C (hooks, parallel with Stream B):
  T002 → T003 → T008
```

## Parallel Example: Phase 4 (US2)

```
Stream A:  T013 (FlagMoveToMenu) → T015 (FlagMenu) → T017 (FlagList DnD)
Stream B:  T014 (FlagCreateRow, standalone)
Stream C:  T016 (FlagRow DnD, after Phase 3) → T017
```

---

## Implementation Strategy

### MVP First (US1 + US2 only)

1. Complete Phase 1: Install DnD
2. Complete Phase 2: Foundation (types, store, utilities) — CRITICAL
3. Complete Phase 3: US1 — visual hierarchy with connectors
4. **STOP and VALIDATE**: Flag tree renders correctly with seed data
5. Complete Phase 4: US2 — assign children via DnD and menu
6. **STOP and VALIDATE**: Full assignment/reparent flow works
7. Ship MVP

### Incremental Delivery

1. Setup + Foundation → all store actions available
2. US1 → tree renders ✅ Demo
3. US2 → assignment and DnD ✅ Demo
4. US3 → validated multi-level (no code, only e2e)
5. US4 → detach + delete promotion ✅ Demo
6. US5 → collapse/expand ✅ Demo
7. Polish → type guards, TS check, final validation

### Parallel Team Strategy

After Phase 2 completes:
- **Developer A**: US1 → US2 (critical path, MVP)
- **Developer B**: US5 (only needs Phase 3 done — collapse toggle on FlagRow)
- **Developer C**: US4 (needs Phase 4 FlagMenu "Detach" — can be coordinated with Developer A)

---

## Notes

- `[P]` tasks touch different files and have no mutual dependencies — safe to execute concurrently
- `[Story]` label maps each task to its user story for traceability
- Store tasks T003–T006 all modify `store/index.ts` — execute sequentially in one editing session
- Inline `style` props are permitted **only** for: (1) DnD transform values (`CSS.Transform.toString(transform)`) and (2) depth-based indentation (`depth * indentWidth + "px"`) — both are dynamic runtime values Tailwind cannot express
- Vitest tests (T009) and Playwright tests (T018, T020, T023) are constitutionally mandated (Principle V) — not optional
- Playwright test file path: `apps/web/e2e/feature-flags/flag-groups.spec.ts` — create directory if it does not exist
- Commit after each phase checkpoint using Conventional Commits format (`feat:`, `test:`, etc.)
