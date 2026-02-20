# Data Model: Email & Password Authentication

**Feature**: `005-email-password-auth`
**Phase**: 1 — Design
**Date**: 2026-02-20

> **Note**: The database schema for authentication is already fully implemented in `packages/db/prisma/schema/auth.prisma`. No new migrations are required for this feature. This document describes the logical data model for reference.

---

## Entities

### User

Represents a registered account holder.

| Field           | Type      | Constraints                     | Notes                              |
|----------------|-----------|---------------------------------|------------------------------------|
| `id`           | `String`  | PK, non-null                    | Opaque unique identifier           |
| `name`         | `String`  | non-null, min 2 chars           | Display name shown in UI           |
| `email`        | `String`  | non-null, unique, valid format  | Login identifier; must be unique   |
| `emailVerified`| `Boolean` | default `false`                 | Not enforced for access in v1      |
| `image`        | `String?` | nullable                        | Profile image URL; unused in v1    |
| `createdAt`    | `DateTime`| default `now()`                 | Account creation timestamp         |
| `updatedAt`    | `DateTime`| auto-updated                    | Last modification timestamp        |

**Relationships**: Has many `Session`, has many `Account`.

**Validation rules** (enforced at application boundary):
- `name`: minimum 2 characters
- `email`: must be a valid email address
- `email`: must be unique across all users (enforced at DB level)

---

### Session

An active authenticated period for a user. Created on successful sign-in; destroyed on sign-out or expiry.

| Field       | Type      | Constraints       | Notes                                    |
|------------|-----------|-------------------|------------------------------------------|
| `id`       | `String`  | PK, non-null      | Session identifier                       |
| `token`    | `String`  | unique, non-null  | Secure random token stored in HTTP-only cookie |
| `expiresAt`| `DateTime`| non-null          | Session expiry; managed by Better Auth   |
| `userId`   | `String`  | FK → User         | Owner of the session                     |
| `ipAddress`| `String?` | nullable          | Client IP at session creation            |
| `userAgent`| `String?` | nullable          | Browser user agent at session creation   |
| `createdAt`| `DateTime`| default `now()`   |                                          |
| `updatedAt`| `DateTime`| auto-updated      |                                          |

**Lifecycle**: Created by Better Auth on sign-in. Deleted by Better Auth on sign-out. Expired sessions are ignored by `getSession()`.

---

### Account

Links a user to an authentication provider. For this feature, the only provider is `credential` (email/password).

| Field                   | Type      | Constraints | Notes                                 |
|------------------------|-----------|-------------|---------------------------------------|
| `id`                   | `String`  | PK          |                                       |
| `accountId`            | `String`  | non-null    | User's ID in the provider system      |
| `providerId`           | `String`  | non-null    | Always `"credential"` for email/pass  |
| `userId`               | `String`  | FK → User   | Owning user                           |
| `password`             | `String?` | nullable    | Hashed password (bcrypt); never returned to client |
| `accessToken`          | `String?` | nullable    | Unused for credential provider        |
| `refreshToken`         | `String?` | nullable    | Unused for credential provider        |
| `createdAt`            | `DateTime`| default `now()` |                               |
| `updatedAt`            | `DateTime`| auto-updated |                               |

**Security note**: Passwords are hashed by Better Auth before storage. The raw password is never persisted or logged.

---

### Verification

Used for email verification tokens and password reset tokens. Only the email verification flow writes to this table. Password reset is out of scope for this feature.

| Field        | Type      | Constraints | Notes                                 |
|-------------|-----------|-------------|---------------------------------------|
| `id`        | `String`  | PK          |                                       |
| `identifier`| `String`  | non-null    | Email or user ID this token belongs to |
| `value`     | `String`  | non-null    | The token value                       |
| `expiresAt` | `DateTime`| non-null    | Token expiry                          |
| `createdAt` | `DateTime`| default `now()` |                               |
| `updatedAt` | `DateTime`| auto-updated |                               |

---

## Client-Side State

Auth state is **server-owned**. No Zustand store is introduced for this feature.

| State            | Owner              | Access Pattern                          |
|-----------------|--------------------|-----------------------------------------|
| Active session  | Better Auth server | `authClient.useSession()` (reactive hook) |
| Session loading | Better Auth client | `authClient.useSession().isPending`     |
| User profile    | Better Auth server | `authClient.useSession().data?.user`    |

**TanStack Query integration**: `authClient.useSession()` internally uses a React Query-compatible cache. No manual cache invalidation is needed — Better Auth manages session state reactively.

---

## State Transitions

```
[No Account]
    │
    │  sign-up (name, email, password)
    ▼
[Registered, No Session]
    │
    │  sign-in (email, password)
    ▼
[Registered, Active Session] ◄──────────────────────┐
    │                                                │
    │  sign-out / session expires                    │ sign-in
    ▼                                                │
[Registered, No Session] ────────────────────────────┘
```

**Session persistence**: Sessions survive browser refresh (stored as HTTP-only cookies). Session expiry is managed by Better Auth's default configuration.
