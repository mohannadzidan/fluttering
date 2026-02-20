# Quickstart: Email & Password Authentication

**Feature**: `005-email-password-auth`
**Date**: 2026-02-20

---

## Prerequisites

Ensure the monorepo is set up and running:

```bash
# From repo root
pnpm install

# Ensure .env files are in place:
# apps/server/.env  → DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, CORS_ORIGIN
# apps/web/.env     → VITE_SERVER_URL

# Start both apps in parallel
pnpm dev
```

- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3000`

---

## Database Setup

The auth schema is already defined in `packages/db/prisma/schema/auth.prisma`. If the database is fresh, run migrations:

```bash
# From repo root
pnpm --filter @fluttering/db db:push
# or if using migrations:
pnpm --filter @fluttering/db migrate:dev
```

Verify the database has the auth tables: `user`, `session`, `account`, `verification`.

---

## Environment Variables

### `apps/server/.env`
```env
DATABASE_URL=file:../../../local.db
BETTER_AUTH_SECRET=<32-char-random-string>
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001
NODE_ENV=development
```

### `apps/web/.env`
```env
VITE_SERVER_URL=http://localhost:3000
```

---

## Key Files

### Auth Feature Module (to be created by this feature)

```
apps/web/src/features/auth/
├── index.ts                   ← import from here: AuthRoot, UserMenu, authClient
├── components/
│   ├── auth-root.tsx          ← login page composition (sign-in ↔ sign-up toggle)
│   ├── sign-in-form.tsx       ← sign-in form
│   ├── sign-up-form.tsx       ← sign-up form
│   └── user-menu.tsx          ← header user menu dropdown
└── utils/
    ├── auth-client.ts         ← Better Auth client instance
    └── route-guards.ts        ← reusable beforeLoad guard functions
```

### Routes

```
apps/web/src/routes/
├── __root.tsx    ← add <Header /> here (app shell)
├── index.tsx     ← add protectRoute() beforeLoad
├── login.tsx     ← import AuthRoot; add redirectIfAuthenticated() beforeLoad
└── dashboard.tsx ← update to use shared protectRoute()
```

### Auth Package (already complete — read-only)

```
packages/auth/src/index.ts    ← Better Auth server instance (email/password enabled)
packages/db/prisma/schema/
├── auth.prisma               ← User, Session, Account, Verification models
└── schema.prisma             ← datasource (SQLite)
```

---

## Auth Flow Summary

### Sign Up

1. User navigates to `/login` → sees sign-up form by default
2. Fills in name, email, password → submits
3. `authClient.signUp.email()` posts to `POST /api/auth/sign-up/email`
4. Better Auth creates user, account, session; sets HTTP-only cookie
5. `onSuccess` → navigate to `/`

### Sign In

1. User on `/login` → toggles to sign-in form
2. Fills in email, password → submits
3. `authClient.signIn.email()` posts to `POST /api/auth/sign-in/email`
4. Better Auth validates credentials; sets HTTP-only cookie
5. `onSuccess` → navigate to `/`

### Session Check (Route Guard)

```typescript
// In any protected route's beforeLoad:
import { protectRoute } from "@/features/auth";

export const Route = createFileRoute("/your-route")({
  beforeLoad: protectRoute,
  component: YourComponent,
});
```

### Sign Out

```typescript
// UserMenu component handles this:
authClient.signOut({
  fetchOptions: {
    onSuccess: () => navigate({ to: "/" }),
  },
});
```

---

## Running E2E Tests

```bash
# From apps/web directory (or via turbo from root)
pnpm test:e2e

# With UI (interactive)
pnpm test:e2e:ui

# Run only auth tests
pnpm test:e2e -- auth.spec.ts
```

> Tests require both frontend (3001) and backend (3000) servers running. The Playwright config auto-starts the Vite dev server; ensure the backend is running manually or via the monorepo `pnpm dev` command.

---

## Common Issues

**"CORS error on auth requests"**: Ensure `CORS_ORIGIN` in server `.env` matches the frontend origin exactly (including port). The server cors config allows credentials.

**"Session not persisting"**: Better Auth uses `sameSite: none, secure: true` cookies. In development with HTTP (not HTTPS), the browser may reject these. If testing locally, ensure you access the app via `http://localhost:3001` (not via IP or a different hostname).

**"Database not found"**: Run `pnpm --filter @fluttering/db db:push` to create the SQLite database file.

**"Auth table missing"**: The auth schema must be pushed separately. Ensure `packages/db/prisma/schema/auth.prisma` is included in the Prisma schema directory configuration.
