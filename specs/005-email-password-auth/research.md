# Research: Email & Password Authentication

**Feature**: `005-email-password-auth`
**Phase**: 0 — Pre-design research
**Date**: 2026-02-20

---

## 1. Existing Auth Infrastructure

**Decision**: Build on the existing Better Auth + Prisma setup — no new auth library or schema changes required.

**Rationale**: The codebase already has `packages/auth` (Better Auth with `emailAndPassword: { enabled: true }`), `packages/db` with full auth schema (User, Session, Account, Verification), and `apps/server` wiring Better Auth at `/api/auth/*`. The Prisma schema is complete. The focus of this feature is the **frontend feature module structure, route guards, UI composition, and E2E tests**.

**Alternatives considered**: Replacing Better Auth with a custom JWT solution (rejected — adds complexity and breaks the established stack); adding a separate auth backend service (rejected — single Express server is sufficient).

---

## 2. Feature Module Structure

**Decision**: Create `apps/web/src/features/auth/` and move all auth-related UI into it. Delete scattered top-level components.

**Rationale**: The constitution (Principle II) forbids top-level `components/` directories for product features. Currently `sign-in-form.tsx`, `sign-up-form.tsx`, and `user-menu.tsx` live in `apps/web/src/components/`, which violates this principle. The `feature-flags` module confirms the correct pattern: one public `index.ts` exporting only top-level composed components; all internal components, hooks, and utilities are private.

**Structure**:
```
features/auth/
├── index.ts                    ← public API only
├── components/
│   ├── auth-root.tsx           ← new: composes sign-in/sign-up with toggle (replaces login.tsx logic)
│   ├── sign-in-form.tsx        ← moved from src/components/
│   ├── sign-up-form.tsx        ← moved from src/components/
│   └── user-menu.tsx           ← moved from src/components/
├── utils/
│   ├── auth-client.ts          ← moved from src/lib/auth-client.ts
│   └── route-guards.ts         ← new: reusable beforeLoad guard functions
└── types/
    └── index.ts                ← auth-specific TypeScript types (if needed)
```

**No `store/` directory**: Auth session state is server-owned (Better Auth) and managed reactively via `authClient.useSession()`. No Zustand store needed. Complies with Principle IV.

**`authClient` placement**: Moves to `features/auth/utils/auth-client.ts`. It is auth-specific, not a general utility. The feature's `index.ts` re-exports it so routes can import `authClient` from `@/features/auth`.

**`header.tsx` stays in `src/components/`**: The header is an app-wide layout shell, not auth-specific. It imports `UserMenu` from the auth feature.

**Alternatives considered**: Keeping components in `src/components/` (rejected — violates Principle II); exporting all form components from `index.ts` (rejected — over-exposure, follows pattern of feature-flags which only exports the layout component).

---

## 3. Route Guard Pattern

**Decision**: Use reusable async guard functions in `features/auth/utils/route-guards.ts`, applied via `beforeLoad` in each route file. No global parent-route guard.

**Rationale**: TanStack Router v1 file-based routing has no built-in "route group" guard. Each route must opt-in to `beforeLoad`. Extracting guards to a shared utility (`protectRoute`, `redirectIfAuthenticated`) prevents duplication without adding a wrapper layer. The existing dashboard route already uses this pattern; the plan standardizes it.

**Guard functions**:
- `protectRoute()` — called in `beforeLoad` of all protected routes; redirects to `/login` if no session
- `redirectIfAuthenticated()` — called in `beforeLoad` of `/login`; redirects to `/` if session exists

**Routes to update**:
- `/login` — add `redirectIfAuthenticated()` guard (currently has no guard)
- `/` (home/FlagsLayout) — add `protectRoute()` guard (currently unprotected)
- `/dashboard` — already has its own `beforeLoad`; standardize to use shared `protectRoute()`

**URL preservation (redirect-back)**: Not implemented in this feature iteration. The spec does not require it (no acceptance scenario tests it). Simple redirect to `/` on successful login is sufficient.

**Alternatives considered**: Global guard in `__root.tsx` `beforeLoad` (rejected — runs for ALL routes including `/login` itself, causing loops); parent layout route for protected pages (rejected — adds file complexity for a feature that doesn't need it per YAGNI).

---

## 4. Header Integration

**Decision**: Add the `<Header />` component to `__root.tsx` so it appears on every page, including the login page.

**Rationale**: The `Header` component already handles both authenticated and unauthenticated states gracefully — it renders a "Sign In" button when no session exists and the `UserMenu` when authenticated. Adding it to the root layout is the simplest approach and avoids managing it per-route. The login page benefits from having the header (consistent shell, easy navigation back).

**Alternatives considered**: Only show header on protected routes via a layout file (rejected — premature; header gracefully adapts to auth state); create a separate authenticated layout route (rejected — over-engineering for the current scope).

---

## 5. getSession() vs useSession()

**Decision**: Use `authClient.getSession()` in `beforeLoad` hooks for route guards; use `authClient.useSession()` in components for reactive UI state.

**Rationale**: `getSession()` is async and runs before the component renders, making it the correct choice for guards. `useSession()` is a reactive hook that triggers re-renders on session changes and provides `isPending` for loading states. The sign-in and sign-up forms already use `useSession().isPending` to show a loader while the initial session check runs — this pattern should be preserved.

**Alternatives considered**: Using `useSession()` in `beforeLoad` (impossible — hooks cannot run outside React components); using `getSession()` in components (possible but loses reactivity — session changes wouldn't trigger re-renders).

---

## 6. E2E Test Strategy

**Decision**: Create `apps/web/e2e/auth.spec.ts` as a single spec file with describe blocks per user story. Create `apps/web/e2e/auth-helpers.ts` for shared test utilities.

**Rationale**: The existing test file (`enum-types.spec.ts`) uses a single-file, multi-describe-block approach. Keeping auth tests in one file reduces boilerplate while organizing by user story. Auth helpers (signUp, signIn, signOut actions) will be reused across auth tests and by future features that need an authenticated state.

**`data-testid` to add** (convention: kebab-case with component prefix):

| Component      | Attribute                | Purpose                        |
|---------------|--------------------------|--------------------------------|
| sign-up-form  | `sign-up-name-input`     | Name field for E2E targeting   |
| sign-up-form  | `sign-up-email-input`    | Email field                    |
| sign-up-form  | `sign-up-password-input` | Password field                 |
| sign-up-form  | `sign-up-submit-button`  | Submit button                  |
| sign-up-form  | `sign-in-toggle-button`  | Switch to sign-in              |
| sign-in-form  | `sign-in-email-input`    | Email field                    |
| sign-in-form  | `sign-in-password-input` | Password field                 |
| sign-in-form  | `sign-in-submit-button`  | Submit button                  |
| sign-in-form  | `sign-up-toggle-button`  | Switch to sign-up              |
| user-menu     | `user-menu-trigger`      | User menu button               |
| user-menu     | `sign-out-button`        | Sign-out menu item             |
| user-menu     | `sign-in-link`           | Sign in link (unauthenticated) |

**Database state between tests**: Each sign-up test uses a unique email (UUID or timestamp-based) to avoid conflicts in the shared SQLite database. No database reset between tests — acceptable for this scope.

**Alternatives considered**: Six separate spec files (one per user story) — rejected as overkill for ~20 tests; Playwright fixtures for pre-authenticated state — deferred until another feature needs it.

---

## 7. Principle III Exception (Better Auth vs tRPC)

**Decision**: Better Auth client calls (`authClient.signIn.email()`, `authClient.signUp.email()`, `authClient.signOut()`) are an **accepted exception** to the tRPC-only rule.

**Rationale**: The constitution explicitly lists "Better Auth" in the technology stack and states it is "integrated into tRPC middleware." This means the tRPC `protectedProcedure` middleware validates Better Auth sessions — the tRPC layer IS the integration point. Better Auth's own endpoints (`/api/auth/*`) are managed by the external library, not internal API routes created by the team. Routing auth flows through tRPC would require reimplementing Better Auth's session management from scratch, which contradicts Principle VI (YAGNI).

This exception is documented in the Complexity Tracking table in `plan.md`.

**Alternatives considered**: Wrapping `signIn`/`signUp` in tRPC mutations (rejected — tRPC cannot set secure HTTP-only cookies on behalf of Better Auth; would break session management); using raw fetch to `/api/auth/*` directly (rejected — authClient already provides type-safe wrappers with error handling).
