# Implementation Plan: Email & Password Authentication

**Branch**: `005-email-password-auth` | **Date**: 2026-02-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-email-password-auth/spec.md`

## Summary

Deliver a complete, constitution-compliant email/password authentication experience. The backend infrastructure (Better Auth, Prisma schema, Express middleware, tRPC session validation) is already in place. This feature focuses on: (1) reorganizing existing auth UI components into a proper `features/auth/` module per Principle II; (2) adding missing route guards to protect the home route and redirect authenticated users away from the login page; (3) integrating the header into the root layout; and (4) adding data-testid attributes and Playwright E2E tests for all auth user journeys.

## Technical Context

**Language/Version**: TypeScript 5.x strict mode, no `any`
**Primary Dependencies**: React 19.x, Better Auth (existing), TanStack Router v1, TanStack Form (existing), TanStack Query v5, Zod (existing), shadcn/ui (existing), Lucide React (existing)
**Storage**: SQLite via Prisma — schema already complete, no migrations required
**Testing**: Playwright E2E (auth journeys); Vitest (no new unit tests — no new pure logic functions)
**Target Platform**: Web — Vite SPA (`apps/web`) + Express server (`apps/server`)
**Project Type**: Monorepo web application
**Performance Goals**: Session validation via `getSession()` < 500ms (network round-trip to local server); sign-in / sign-up form submission response < 2s
**Constraints**: No email service (password reset out of scope); no account lockout; session lifetime uses Better Auth defaults
**Scale/Scope**: Single-tenant developer tool; no multi-user or role-based access requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Composition Over Prop Drilling | ✅ PASS | `AuthRoot` composes `SignInForm`/`SignUpForm` with a local toggle state. No boolean prop proliferation. `UserMenu` uses shadcn `DropdownMenu` composition. |
| II. Feature-Based Architecture | ✅ PASS (after migration) | Currently VIOLATED — `sign-in-form.tsx`, `sign-up-form.tsx`, `user-menu.tsx` are in `src/components/`. This plan moves them to `features/auth/`. No cross-feature internal imports. `authClient` moves to `features/auth/utils/`. |
| III. Type-Safe API Contract | ⚠️ EXCEPTION (justified) | Better Auth client makes direct HTTP calls to `/api/auth/*`, bypassing tRPC. **Justified**: Better Auth is explicitly in the constitution's tech stack; its endpoints cannot be routed through tRPC without reimplementing session management. tRPC middleware (`protectedProcedure` via `createContext`) validates Better Auth sessions — this IS the integration point. See Complexity Tracking. |
| IV. State Isolation | ✅ PASS | No Zustand store introduced. Auth session is server-owned (Better Auth). `useSession()` uses TanStack Query internally. Server state is not duplicated. |
| V. Test Discipline | ✅ PASS | All auth user journeys (sign-up, sign-in, sign-out, protected routes, user identity) covered by Playwright E2E tests. `data-testid` attributes added to all auth components. |
| VI. Simplicity & YAGNI | ✅ PASS | No new abstractions for single call-sites. Shared guard utilities serve 3+ routes. No future-proofing (no OAuth hooks, no role system). Existing code is reorganized, not rewritten. |

## Project Structure

### Documentation (this feature)

```text
specs/005-email-password-auth/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── auth-api.md      ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks — not created here)
```

### Source Code Changes

```text
apps/web/src/
├── routes/
│   ├── __root.tsx               ← UPDATE: add <Header /> to root layout
│   ├── index.tsx                ← UPDATE: add protectRoute() beforeLoad
│   ├── login.tsx                ← UPDATE: import AuthRoot; add redirectIfAuthenticated() beforeLoad
│   └── dashboard.tsx            ← UPDATE: switch to shared protectRoute() utility
│
├── features/
│   └── auth/                    ← CREATE: new feature module
│       ├── index.ts             ← CREATE: public API surface
│       ├── components/
│       │   ├── auth-root.tsx    ← CREATE: compose sign-in/sign-up with toggle
│       │   ├── sign-in-form.tsx ← MOVE from src/components/sign-in-form.tsx
│       │   ├── sign-up-form.tsx ← MOVE from src/components/sign-up-form.tsx
│       │   └── user-menu.tsx    ← MOVE from src/components/user-menu.tsx
│       └── utils/
│           ├── auth-client.ts   ← MOVE from src/lib/auth-client.ts
│           └── route-guards.ts  ← CREATE: protectRoute / redirectIfAuthenticated
│
├── components/
│   ├── header.tsx               ← UPDATE: import UserMenu from @/features/auth
│   ├── sign-in-form.tsx         ← DELETE (moved to feature)
│   ├── sign-up-form.tsx         ← DELETE (moved to feature)
│   └── user-menu.tsx            ← DELETE (moved to feature)
│
└── lib/
    └── auth-client.ts           ← DELETE (moved to feature)

apps/web/e2e/
├── auth.spec.ts                 ← CREATE: Playwright tests for all auth user journeys
└── auth-helpers.ts              ← CREATE: shared signUp / signIn / signOut helpers
```

**Structure Decision**: Monorepo web application. The auth feature lives entirely within `apps/web/src/features/auth/`. No changes to `apps/server/`, `packages/auth/`, or `packages/db/` — backend is already complete.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle III exception: Better Auth client bypasses tRPC | Better Auth manages session cookies, CSRF protection, and auth endpoints via its own HTTP layer. Routing auth flows through tRPC would require reimplementing all of this. | Wrapping `signIn`/`signUp` in tRPC mutations cannot set HTTP-only cookies on behalf of Better Auth, breaking the session mechanism. The constitution explicitly lists Better Auth as the auth technology, making this a deliberate stack decision, not a violation. |
