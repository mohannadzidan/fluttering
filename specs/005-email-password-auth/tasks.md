# Tasks: Email & Password Authentication

**Input**: Design documents from `/specs/005-email-password-auth/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/auth-api.md ✅ | quickstart.md ✅

**Tests**: Playwright E2E tests are included — required by Constitution Principle V for all critical user journeys.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks in same phase)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in all descriptions

## Path Conventions (Monorepo)

- Frontend: `apps/web/src/features/auth/` (new feature module)
- Routes: `apps/web/src/routes/`
- Shared components: `apps/web/src/components/`
- E2E tests: `apps/web/e2e/`

---

## Phase 1: Setup (Feature Module Scaffold)

**Purpose**: Create the `features/auth/` directory scaffold so all subsequent tasks have valid import targets. No logic yet.

- [x] T001 Create `apps/web/src/features/auth/index.ts` as an empty placeholder (no exports yet — will be filled incrementally by later tasks). Also create empty directories: `components/`, `utils/`, `types/`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core shared utilities required by ALL user story implementations. Must be complete before any component work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Create `apps/web/src/features/auth/utils/auth-client.ts` — copy content from `apps/web/src/lib/auth-client.ts` verbatim. This is the Better Auth client instance (`createAuthClient` from `better-auth/react` pointing to `env.VITE_SERVER_URL`). Downstream files will import from this new path.
- [x] T003 [P] Create `apps/web/src/features/auth/utils/route-guards.ts` — implement two exported async functions: `protectRoute()` (calls `authClient.getSession()`; if `!session.data`, calls `redirect({ to: "/login", throw: true })`; returns `{ session }`) and `redirectIfAuthenticated()` (calls `authClient.getSession()`; if `session.data`, calls `redirect({ to: "/", throw: true })`). Import `authClient` from `"../utils/auth-client"` (relative) and `redirect` from `"@tanstack/react-router"`.

**Checkpoint**: `auth-client.ts` and `route-guards.ts` exist and export correctly. All downstream tasks can begin.

---

## Phase 3: User Story 1 — New User Registration (Priority: P1) 🎯 MVP

**Goal**: A visitor can navigate to `/login`, fill in their name, email, and password, submit, and land on the home page. The `/login` route redirects already-authenticated users away. The home route (`/`) is protected.

**Independent Test**: Navigate to `http://localhost:3001/login` in a fresh browser, fill in the sign-up form with valid data, submit, and verify: (1) redirected to `/`, (2) `FlagsLayout` renders. Then navigate to `/login` again while still authenticated — verify redirect back to `/`.

### Implementation for User Story 1

- [x] T004 [US1] Create `apps/web/src/features/auth/components/sign-up-form.tsx` — copy the content from `apps/web/src/components/sign-up-form.tsx` and make these changes: (a) update authClient import to `import { authClient } from "../utils/auth-client"`, (b) add `data-testid="sign-up-name-input"` to the name `<Input>`, (c) add `data-testid="sign-up-email-input"` to the email `<Input>`, (d) add `data-testid="sign-up-password-input"` to the password `<Input>`, (e) add `data-testid="sign-up-submit-button"` to the submit `<Button>`, (f) add `data-testid="sign-in-toggle-button"` to the "Already have an account? Sign In" `<Button>`. Keep all existing logic (TanStack Form, Zod validation, toast, navigate to `/dashboard`) unchanged.
- [x] T005 [US1] Create `apps/web/src/features/auth/components/auth-root.tsx` — compose `SignInForm` and `SignUpForm` with a local `useState(false)` toggle (false = show sign-up, true = show sign-in). Import `SignInForm` from `"./sign-in-form"` and `SignUpForm` from `"./sign-up-form"`. Export `AuthRoot`. Note: `SignInForm` does not exist yet — add it as a stub `export function SignInForm() { return null; }` in `apps/web/src/features/auth/components/sign-in-form.tsx` temporarily so TypeScript resolves. (T009 will replace the stub.)
- [x] T006 [US1] Update `apps/web/src/features/auth/index.ts` — export `AuthRoot` from `"./components/auth-root"`. Also export `protectRoute` and `redirectIfAuthenticated` from `"./utils/route-guards"`. Also export `authClient` from `"./utils/auth-client"`.
- [x] T007 [US1] Update `apps/web/src/routes/login.tsx` — replace the entire file content. Add `beforeLoad: redirectIfAuthenticated` (imported from `"@/features/auth"`). Replace the component body to render `<AuthRoot />` (imported from `"@/features/auth"`). Remove the `useState` toggle logic that was in the route — it is now inside `AuthRoot`.
- [x] T008 [US1] Update `apps/web/src/routes/index.tsx` — add `beforeLoad: protectRoute` to the `createFileRoute("/")` call (imported from `"@/features/auth"`). Keep the `HomeComponent` rendering `<FlagsLayout />` unchanged.
- [x] T009 [US1] Create `apps/web/e2e/auth-helpers.ts` — export three helper functions: `signUp(page, name, email, password)` (navigates to `/login`, fills sign-up fields by `data-testid`, submits, waits for navigation to `/`), `signIn(page, email, password)` (navigates to `/login`, clicks `sign-in-toggle-button`, fills sign-in fields by `data-testid`, submits, waits for navigation to `/`), `signOut(page)` (clicks `user-menu-trigger`, clicks `sign-out-button`, waits for navigation). Use `page.getByTestId()` for all selectors.
- [x] T010 [US1] Create `apps/web/e2e/auth.spec.ts` — add a `test.describe("US1 — Registration")` block with these tests: (T1) valid sign-up → redirected to `/`; (T2) duplicate email → error message visible; (T3) invalid email format → inline validation error; (T4) password < 8 chars → inline validation error; (T5) empty name field → inline validation error; (T6) already-authenticated user visiting `/login` → redirected to `/`. Use `signUp` helper from `auth-helpers.ts` for T1. Use unique email per test (e.g., `` `test-${Date.now()}@example.com` ``). Import `test, expect` from `"@playwright/test"`.

**Checkpoint**: US1 complete. Sign-up works end-to-end. `/login` redirects authenticated users. `/` is protected. All T1–T6 E2E tests pass.

---

## Phase 4: User Story 2 — Returning User Sign-In (Priority: P2)

**Goal**: A registered user can sign in with email and password and reach the home page. Session persists across browser refreshes.

**Independent Test**: Use the `signUp` helper to create an account programmatically, then complete the sign-in form in the browser. Verify redirect to `/`. Reload the page — verify still authenticated (FlagsLayout renders without redirect to login).

### Implementation for User Story 2

- [x] T011 [US2] Replace the stub `apps/web/src/features/auth/components/sign-in-form.tsx` with full content copied from `apps/web/src/components/sign-in-form.tsx`, applying these changes: (a) update authClient import to `import { authClient } from "../utils/auth-client"`, (b) add `data-testid="sign-in-email-input"` to the email `<Input>`, (c) add `data-testid="sign-in-password-input"` to the password `<Input>`, (d) add `data-testid="sign-in-submit-button"` to the submit `<Button>`, (e) add `data-testid="sign-up-toggle-button"` to the "Need an account? Sign Up" `<Button>`. Keep all existing logic unchanged.
- [x] T012 [US2] Update `apps/web/e2e/auth.spec.ts` — add a `test.describe("US2 — Sign-In")` block with these tests: (T7) valid sign-in → redirected to `/`; (T8) wrong password → error toast visible; (T9) non-existent email → error toast visible; (T10) invalid email format → inline validation error; (T11) sign-in form toggle from sign-up → sign-in form appears; (T12) session persists on page reload (sign in, reload, verify `/` still loads without redirect to `/login`). Create a fresh user via the Better Auth API in `beforeEach` for T7–T9 and T12.

**Checkpoint**: US2 complete. Sign-in works end-to-end. Session persists on refresh. All T7–T12 E2E tests pass.

---

## Phase 5: User Story 3 — Sign-Out (Priority: P3)

**Goal**: A signed-in user can sign out via the user menu in the header. Session is terminated and they are redirected to the home page. Protected routes are inaccessible after sign-out.

**Independent Test**: Sign in via helper, verify user name is visible in the header, click the user menu, click "Sign Out", verify redirect to `/login` (since `/` is protected and session is now gone).

### Implementation for User Story 3

- [x] T013 [US3] Create `apps/web/src/features/auth/components/user-menu.tsx` — copy content from `apps/web/src/components/user-menu.tsx` and apply these changes: (a) update authClient import to `import { authClient } from "../utils/auth-client"`, (b) add `data-testid="user-menu-trigger"` to the `<DropdownMenuTrigger>` inner `<Button>`, (c) add `data-testid="sign-out-button"` to the "Sign Out" `<DropdownMenuItem>`, (d) add `data-testid="sign-in-link"` to the "Sign In" `<Button>` rendered when there is no session. Keep all existing logic (useSession, signOut with navigate, skeleton) unchanged. Update the `signOut` navigate destination to `"/"` (which will redirect to `/login` since `/` is now protected).
- [x] T014 [US3] Update `apps/web/src/features/auth/index.ts` — add `export { UserMenu } from "./components/user-menu"` to the existing exports.
- [x] T015 [US3] Update `apps/web/src/components/header.tsx` — change the `UserMenu` import from `"./user-menu"` to `import { UserMenu } from "@/features/auth"`. No other changes.
- [x] T016 [US3] Update `apps/web/src/routes/__root.tsx` — add `import { Header } from "@/components/header"` (or the correct named export from header.tsx — check the existing export name). Inside `RootComponent`, wrap the layout so `<Header />` renders above `<Outlet />`. The div structure should be: `<div className="h-svh flex flex-col"><Header /><Outlet /></div>`. Keep ThemeProvider, Toaster, and devtools unchanged.
- [x] T017 [US3] Update `apps/web/e2e/auth.spec.ts` — add a `test.describe("US3 — Sign-Out")` block with these tests: (T13) sign in → click sign-out from user menu → redirected to `/login`; (T14) after sign-out, navigating to `/` redirects to `/login`; (T15) header shows "Sign In" link when unauthenticated.

**Checkpoint**: US3 complete. Header renders on all pages. User menu is visible for authenticated users. Sign-out works. All T13–T15 E2E tests pass.

---

## Phase 6: User Story 4 — Protected Route Enforcement (Priority: P4)

**Goal**: Unauthenticated visitors are redirected to `/login` when accessing any protected route. Authenticated users can access protected routes freely.

**Independent Test**: Open a fresh browser (no session) → navigate directly to `http://localhost:3001/` → verify redirect to `/login`. Open a fresh browser → navigate to `http://localhost:3001/dashboard` → verify redirect to `/login`.

### Implementation for User Story 4

- [x] T018 [US4] Update `apps/web/src/routes/dashboard.tsx` — replace the inline `beforeLoad` implementation with the shared `protectRoute` function: `import { protectRoute } from "@/features/auth"` and set `beforeLoad: protectRoute`. The component body remains unchanged (it still reads `session` from `Route.useRouteContext()`). Verify that `protectRoute` returns `{ session }` in the same shape as before.
- [x] T019 [US4] Update `apps/web/e2e/auth.spec.ts` — add a `test.describe("US4 — Protected Routes")` block with these tests: (T16) unauthenticated access to `/` → redirected to `/login`; (T17) unauthenticated access to `/dashboard` → redirected to `/login`; (T18) authenticated user can access `/` → FlagsLayout renders; (T19) authenticated user can access `/dashboard` → dashboard renders.

**Checkpoint**: US4 complete. All protected routes enforce authentication. All T16–T19 E2E tests pass.

---

## Phase 7: User Story 5 — Persistent User Identity in UI (Priority: P5)

**Goal**: The signed-in user's name is visible in the header on every page. The user menu shows their email and a sign-out option. The unauthenticated state shows a "Sign In" prompt.

**Independent Test**: Sign in via helper → visit `/` → verify `data-testid="user-menu-trigger"` contains the user's name. Open the dropdown → verify email is visible. Sign out → verify `data-testid="sign-in-link"` is visible in the header.

### Implementation for User Story 5

- [x] T020 [US5] Update `apps/web/e2e/auth.spec.ts` — add a `test.describe("US5 — User Identity in Header")` block with these tests: (T20) signed-in user sees their name in `user-menu-trigger` button; (T21) opening user menu shows the user's email address; (T22) unauthenticated visitor sees `sign-in-link` instead of user menu; (T23) user name in header updates immediately after sign-up (name from sign-up form appears in header).

**Checkpoint**: US5 complete. All identity tests pass. All 23 Playwright E2E tests pass.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Clean up relocated files and verify the full test suite is green.

- [x] T021 [P] Delete `apps/web/src/components/sign-in-form.tsx` — file has been replaced by `apps/web/src/features/auth/components/sign-in-form.tsx`. Verify no remaining imports point to the old path before deleting.
- [x] T022 [P] Delete `apps/web/src/components/sign-up-form.tsx` — file has been replaced by `apps/web/src/features/auth/components/sign-up-form.tsx`. Verify no remaining imports point to the old path before deleting.
- [x] T023 [P] Delete `apps/web/src/components/user-menu.tsx` — file has been replaced by `apps/web/src/features/auth/components/user-menu.tsx`. Verify no remaining imports point to the old path before deleting.
- [x] T024 [P] Delete `apps/web/src/lib/auth-client.ts` — file has been replaced by `apps/web/src/features/auth/utils/auth-client.ts`. Verify no remaining imports (including test files) point to the old path before deleting.
- [x] T025 Run `pnpm tsc --noEmit` from repo root and confirm zero TypeScript errors. Fix any import path issues found.
- [x] T026 Run `pnpm --filter @fluttering/web test:e2e` from repo root and confirm all 23 auth E2E tests pass. Fix any selector mismatches or timing issues found.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — can start after T002 and T003 complete
- **US2 (Phase 4)**: Depends on Phase 3 complete (sign-up form must exist before sign-in toggle is added to auth-root; auth-helpers.ts signUp is needed to create users for sign-in tests)
- **US3 (Phase 5)**: Depends on Phase 3 complete (feature index.ts must exist; auth-helpers signIn needed for sign-out tests)
- **US4 (Phase 6)**: Depends on Phase 3 (protectRoute used by dashboard.tsx update) and Phase 5 (header must be in root before protected route tests run)
- **US5 (Phase 7)**: Depends on Phase 5 (user-menu and header must be wired up)
- **Polish (Phase 8)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Foundational
- **US2 (P2)**: Depends on US1 (needs `signUp` helper and `auth-root.tsx` scaffold)
- **US3 (P3)**: Depends on US1 (needs feature `index.ts` and `signIn` helper from US2)
- **US4 (P4)**: Depends on US1 (protectRoute already in index.ts) and US3 (header must be in root layout before testing `/` redirect)
- **US5 (P5)**: Depends on US3 (user-menu must be wired into header)

### Within Each User Story

- Utility/auth-client files before component files
- Component files before index.ts export updates
- Index.ts updates before route file updates
- Route file updates before E2E tests
- E2E helpers before E2E spec tests

### Parallel Opportunities

Within Phase 2: T002 and T003 can run in parallel (different files).
Within Phase 3: T004 (sign-up-form) and T009 (auth-helpers scaffold) can start in parallel; T005 (auth-root) depends on T004.
Within Phase 8: T021, T022, T023, T024 can all run in parallel (different files, all deletions).

---

## Parallel Example: Phase 2 (Foundational)

```text
# Run both foundational tasks simultaneously:
Task A: Create apps/web/src/features/auth/utils/auth-client.ts (T002)
Task B: Create apps/web/src/features/auth/utils/route-guards.ts (T003)
# Both complete → Phase 3 can begin
```

---

## Implementation Strategy

### MVP First (User Story 1 Only — Registration)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002, T003)
3. Complete Phase 3: US1 Registration (T004–T010)
4. **STOP and VALIDATE**: Run E2E tests T1–T6, confirm sign-up flow works end-to-end
5. Demo: user can register and reach the app

### Incremental Delivery

1. Setup + Foundational → feature skeleton ready
2. US1 (Registration) → sign-up works, route protection active (**MVP**)
3. US2 (Sign-In) → returning users can sign in
4. US3 (Sign-Out) → header wired, full session lifecycle works
5. US4 (Protected Routes) → all routes hardened, dashboard guard standardized
6. US5 (User Identity) → complete E2E coverage

### Solo Developer Strategy

Work sequentially: Phase 1 → Phase 2 → US1 → US2 → US3 → US4 → US5 → Polish.
Each phase produces a working, committable increment.

---

## Notes

- [P] tasks = different files, no data dependencies on incomplete tasks in the same phase
- Each user story is independently testable after its phase completes
- Auth-client.ts moves are copy-first, delete-last — old files remain until Phase 8 cleanup
- E2E tests use unique emails (`test-${Date.now()}@example.com`) to avoid conflicts with shared SQLite DB
- The stub `sign-in-form.tsx` created in T005 is replaced wholesale in T011 — do not invest in the stub
- `signOut` navigate destination is `"/"` (not `"/login"`) — the protected route guard handles the redirect
- Commit after each user story phase or logical group of tasks
