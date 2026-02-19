<!--
Sync Impact Report
==================
Version change: INITIAL (blank template) → 1.0.0
Bump type: MAJOR — first ratified adoption from blank template; all principles and sections are new.

Modified principles: N/A (initial fill — no prior principles existed)

Added sections:
  - Core Principles (I–VI)
  - Technology Stack
  - Development Workflow
  - Governance

Removed sections: N/A

Templates requiring updates:
  ✅ .specify/memory/constitution.md          — Updated (this file)
  ✅ .specify/templates/plan-template.md      — Constitution Check uses runtime fill per feature;
                                                 no structural change required. The gate list will be
                                                 derived from principles I–VI when /speckit.plan runs.
  ✅ .specify/templates/spec-template.md      — Generic enough; no structural changes needed.
  ⚠  .specify/templates/tasks-template.md    — Path Conventions section lists "backend/src/,
                                                 frontend/src/" which conflicts with the monorepo
                                                 layout (apps/server/src/, apps/web/src/) mandated
                                                 by the Technology Stack section. Recommend updating
                                                 the Path Conventions block to add a "Monorepo" option.

Follow-up TODOs:
  - RATIFICATION_DATE set to 2026-02-19 (today). Correct if the project inception date differs.
  - Playwright config path is not yet committed to repo; add it once e2e scaffolding is in place.
  - tasks-template.md path convention update is deferred — handle with /speckit.tasks when first
    feature task list is generated.
-->

# Fluttering Constitution

## Core Principles

### I. Composition Over Prop Drilling (NON-NEGOTIABLE)

UI components MUST be built using composition patterns rather than boolean prop proliferation or deep
prop drilling. Shared UI primitives MUST accept `children` and use compound-component or slot patterns
wherever multiple configurations are needed. Any component that accumulates more than 3 configuration
props MUST be refactored into composable subcomponents before merging.

**Rationale**: Composition scales naturally across feature boundaries without creating hidden coupling.
Prop-drilling creates implicit contracts between layers that become breaking changes as the component
tree grows. Fluttering's UI MUST remain easy to extend without modifying internals.

### II. Feature-Based Architecture (NON-NEGOTIABLE)

All product code MUST be organized under a named feature directory, not by technical layer (no
top-level `components/`, `hooks/`, or `pages/` directories inside features). Each feature folder
encapsulates its own components, hooks, store, types, and utils. Cross-feature imports MUST only
target a feature's explicit public interface (`index.ts`). Importing internal modules of another
feature is FORBIDDEN.

Shared cross-feature utilities and primitives belong in `shared/` or the relevant `packages/*`
workspace package.

**Rationale**: Independent development, review, and removal of features requires that feature
boundaries are hard. Layer-first organization creates invisible cross-feature dependencies that make
refactoring and onboarding progressively harder.

### III. Type-Safe API Contract (NON-NEGOTIABLE)

All network communication between the frontend and backend MUST flow through tRPC procedures. Raw
`fetch` or library calls to internal API routes are FORBIDDEN. All procedure input/output MUST be
validated with Zod schemas at the boundary. Prisma MUST be the sole mechanism for database access;
raw SQL is FORBIDDEN unless wrapped in a Prisma `$queryRaw` with explicit justification logged in
the Complexity Tracking table.

**Rationale**: End-to-end TypeScript inference via tRPC eliminates an entire class of
serialization/deserialization runtime errors. Zod schema validation provides a single source of
truth for data contracts shared between client and server.

### IV. State Isolation — Multiple Stores Pattern (NON-NEGOTIABLE)

Each feature domain MUST own exactly one Zustand store. Stores MUST NOT import or directly invoke
actions from other feature stores. Cross-store communication MUST use derived selectors or
React-context bridges, never direct store references. Server state (remote data) MUST be managed
exclusively by TanStack Query; Zustand stores MUST NOT duplicate, cache, or shadow server state.

**Rationale**: Isolated stores prevent state coupling that makes debugging and refactoring painful.
The strict separation of client state (Zustand) and server state (TanStack Query) prevents stale-data
bugs and double-caching, which are especially dangerous in a feature flag system.

### V. Test Discipline

All utility functions and pure business logic MUST have Vitest unit tests. Critical user journeys
(flag creation, evaluation, toggle) MUST be covered by Playwright end-to-end tests. Tests MUST be
authored alongside the code they verify — adding tests retrospectively is acceptable only for bug
fixes. The `main` branch MUST remain green at all times; a failing CI on `main` MUST be treated as
a P0 incident and resolved before any other work.

**Rationale**: Feature flag systems carry high-stakes, production-impacting logic. A misconfigured
or untested flag evaluation path can silently affect all users. Test coverage is a reliability
guarantee, not optional hygiene.

### VI. Simplicity & YAGNI

Every abstraction MUST serve a current, concrete use-case. The rule of three applies: duplication is
acceptable for one and two instances; the third occurrence MUST trigger extraction into a shared
utility. No wrapper layers, utility files, or helper abstractions MUST be introduced for a single
call-site. Features MUST NOT be designed for hypothetical future requirements.

**Rationale**: Over-engineering increases cognitive overhead and maintenance cost. Fluttering's core
value is reliability and developer experience — unwarranted complexity undermines both.

## Technology Stack

The following choices are fixed. Changes require a constitution amendment (see Governance).

| Layer              | Technology      | Constraint                                         |
| ------------------ | --------------- | -------------------------------------------------- |
| Package Manager    | pnpm            | workspace monorepo                                 |
| Language           | TypeScript      | strict mode, no `any`                              |
| Frontend Framework | React           | 19.x                                               |
| Styling            | Tailwind CSS    | v4 only; no inline `style` props for static values |
| UI Primitives      | shadcn/ui       | composition-first usage per Principle I            |
| Routing            | TanStack Router | file-based routes in `apps/web/src/routes/`        |
| Server State       | TanStack Query  | v5; sole owner of remote data                      |
| Client State       | Zustand         | multiple stores pattern per Principle IV           |
| Backend Framework  | Express         | v5                                                 |
| API Layer          | tRPC            | v11; sole communication channel per Principle III  |
| Database ORM       | Prisma          | latest; sole DB access layer per Principle III     |
| Database Engine    | SQLite          | local file; path configurable via env              |
| Authentication     | Better Auth     | integrated into tRPC middleware                    |
| Unit Testing       | Vitest          | utility functions and pure logic                   |
| E2E Testing        | Playwright      | critical user journeys                             |

**Monorepo layout**:

```
apps/
  web/      # React frontend (Vite)
  server/   # Express + tRPC backend
packages/   # Shared workspace packages (api, auth, db, env, config)
```

**Feature module layout** inside `apps/web/src/features/<feature-name>/`:

```
components/   # Loosely coupled, composition-first UI components
hooks/        # Feature-specific React hooks
store/        # One Zustand store per feature (index.ts)
types/        # Feature-local TypeScript types
utils/        # Pure utility functions — MUST have Vitest unit tests
index.ts      # Public API surface; only import this from outside the feature
```

## Development Workflow

- **Branching**: Feature work MUST live on a dedicated branch. Direct commits to `main` are FORBIDDEN.
- **Conventional Commits**: All commits MUST use Conventional Commits format:
  `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- **Quality Gates**: CI MUST run `tsc --noEmit`, Vitest, and Playwright before a PR can be merged.
  Merge is BLOCKED if any gate fails.
- **Code Reviews**: Every PR MUST receive at least one approval before merging.
- **Imports**: Absolute imports MUST be used within apps (via `tsconfig` path aliases). Relative
  imports are acceptable only within the same feature folder.
- **Styling**: Tailwind utility classes MUST be used for all styling. Inline `style` props are
  permitted only for dynamic values that Tailwind cannot express (e.g., CSS variables from JS).
- **Constitution Check gate**: Each feature plan.md MUST evaluate compliance against Principles I–VI
  before Phase 0 research begins. Non-compliance MUST be recorded in the Complexity Tracking table
  with explicit justification.

## Governance

This constitution supersedes all other project conventions and documentation. Any practice not
addressed here defaults to TypeScript and React community best practices.

**Amendment procedure**:

1. Open a PR titled `docs: amend constitution to vX.Y.Z — <one-line summary>`.
2. Describe the principle change and its rationale in the PR description.
3. Increment `CONSTITUTION_VERSION` following the versioning policy below.
4. Update `LAST_AMENDED_DATE` to today's date (ISO 8601).
5. Run `/speckit.constitution` to propagate changes to dependent templates.
6. Obtain approval from at least one team member before merging.

**Versioning policy**:

- **MAJOR**: Removal or backward-incompatible redefinition of an existing principle.
- **MINOR**: Addition of a new principle or materially expanded guidance in an existing section.
- **PATCH**: Clarifications, wording improvements, or typo fixes with no semantic change.

**Compliance review**: The Constitution Check section in each `plan.md` MUST be evaluated against
all six principles before Phase 0 research and re-evaluated after Phase 1 design. Any violation not
justified in the Complexity Tracking table is grounds to reject the plan.

---

**Version**: 1.0.0 | **Ratified**: 2026-02-19 | **Last Amended**: 2026-02-19
