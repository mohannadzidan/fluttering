# Auth API Contract: Email & Password Authentication

**Feature**: `005-email-password-auth`
**API Type**: Better Auth HTTP endpoints (managed by the `better-auth` library)
**Base URL**: `http://localhost:3000/api/auth` (development)
**Auth**: HTTP-only secure cookies (set automatically by Better Auth)

> **Note**: These endpoints are served by Better Auth middleware in `apps/server`. They are NOT tRPC procedures. All request/response shapes are determined by the Better Auth library and are accessed on the frontend exclusively through `authClient` from `features/auth/utils/auth-client.ts`. Never call these endpoints directly via `fetch`.

---

## Sign Up

**Endpoint**: `POST /api/auth/sign-up/email`

**Request body**:
```json
{
  "name": "string (min 2 chars)",
  "email": "string (valid email format)",
  "password": "string (min 8 chars)"
}
```

**Success response** (`200 OK`):
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "emailVerified": false,
    "createdAt": "ISO 8601 datetime",
    "updatedAt": "ISO 8601 datetime"
  },
  "session": {
    "token": "string",
    "expiresAt": "ISO 8601 datetime"
  }
}
```
Also sets `better-auth.session_token` HTTP-only cookie.

**Error responses**:

| Status | Code | Condition |
|--------|------|-----------|
| `422`  | `USER_ALREADY_EXISTS` | Email is already registered |
| `422`  | `INVALID_EMAIL` | Email format invalid |
| `422`  | `PASSWORD_TOO_SHORT` | Password < 8 characters |

**Frontend usage**:
```typescript
authClient.signUp.email({ name, email, password }, {
  onSuccess: () => navigate({ to: "/" }),
  onError: (error) => toast.error(error.error.message),
})
```

---

## Sign In

**Endpoint**: `POST /api/auth/sign-in/email`

**Request body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Success response** (`200 OK`):
```json
{
  "user": { "id": "string", "name": "string", "email": "string", ... },
  "session": { "token": "string", "expiresAt": "ISO 8601 datetime" }
}
```
Also sets `better-auth.session_token` HTTP-only cookie.

**Error responses**:

| Status | Code | Condition |
|--------|------|-----------|
| `401`  | `INVALID_EMAIL_OR_PASSWORD` | Wrong credentials or user not found |

**Frontend usage**:
```typescript
authClient.signIn.email({ email, password }, {
  onSuccess: () => navigate({ to: "/" }),
  onError: (error) => toast.error(error.error.message),
})
```

---

## Sign Out

**Endpoint**: `POST /api/auth/sign-out`

**Request body**: empty

**Success response** (`200 OK`): empty body. Clears the session cookie.

**Frontend usage**:
```typescript
authClient.signOut({
  fetchOptions: {
    onSuccess: () => navigate({ to: "/" }),
  },
})
```

---

## Get Session

**Endpoint**: `GET /api/auth/get-session`

**Headers**: Automatically sends the session cookie.

**Success response** (`200 OK`):
```json
{
  "user": { "id": "string", "name": "string", "email": "string", ... },
  "session": { "token": "string", "expiresAt": "ISO 8601 datetime", ... }
}
```

**No session response** (`200 OK`):
```json
null
```

**Frontend usage** (route guard):
```typescript
const session = await authClient.getSession();
if (!session.data) { redirect({ to: "/login", throw: true }); }
```

**Frontend usage** (component):
```typescript
const { data: session, isPending } = authClient.useSession();
```

---

## tRPC Protected Procedure (Session Validation)

All tRPC procedures wrapped with `protectedProcedure` validate the session via Better Auth middleware in `createContext`. This is the integration point between Better Auth and tRPC.

**Middleware flow**:
```
HTTP Request (with session cookie)
    → Express server
    → createContext() calls auth.api.getSession()
    → tRPC context = { session: Session | null }
    → protectedProcedure checks ctx.session !== null
    → throws UNAUTHORIZED (401) if no session
```

**Error shape** (UNAUTHORIZED):
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```
