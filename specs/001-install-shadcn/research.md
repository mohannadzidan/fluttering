# Research: shadcn/ui Complete Component Library Setup

**Feature**: 001-install-shadcn | **Date**: 2026-02-19

## Findings

### 1. Installation Method

**Decision**: Use `shadcn add --all --yes --overwrite` from within `apps/web`

**Rationale**: The shadcn CLI (v3.6.2, already installed in `apps/web`) exposes an `--all` flag on the `add` command that installs every component available in the configured registry in a single invocation. This is the canonical, supported method — no manual component enumeration needed.

**Alternatives considered**:
- Listing all component names explicitly (`shadcn add accordion alert badge ...`) — rejected: brittle, tedious, and misses components added to the registry over time
- Installing from a pinned registry snapshot — rejected: unnecessary complexity; the CLI version is already pinned via `package.json`

**Command**:
```bash
cd apps/web
pnpm shadcn add --all --yes --overwrite
```

---

### 2. Style Architecture (`base-lyra` + `@base-ui/react`)

**Decision**: No style changes — `base-lyra` remains the configured style

**Rationale**: The `components.json` file specifies `"style": "base-lyra"`. This is a shadcn style that generates components backed by `@base-ui/react` primitives rather than the traditional Radix UI primitives. The existing components confirm this: `button.tsx` imports from `@base-ui/react/button`, `dropdown-menu.tsx` from `@base-ui/react/menu`. The CLI reads `components.json` automatically and generates all new components in the same style — no extra flags needed.

**Implication**: The project does NOT use Radix UI. Peer dependencies added by the CLI will pull `@base-ui/react` sub-packages, not `@radix-ui/*` packages. This is correct and expected.

**Alternatives considered**:
- Switching to `default` or `new-york` style (Radix UI backed) — rejected: would require replacing all existing `@base-ui` component usage across the app; significant regression risk outside this feature's scope

---

### 3. Peer Dependency Resolution

**Decision**: Let the CLI auto-install all peer dependencies

**Rationale**: `shadcn add` resolves and installs required packages into `apps/web/package.json` automatically. Using `pnpm` as the package manager (detected via `packageManager: pnpm@10.25.0` in root `package.json`), the CLI will use pnpm to install. No manual dependency management required.

**Expected new packages** (based on standard component requirements):
- `embla-carousel-react` — Carousel
- `input-otp` — InputOTP
- `react-day-picker` — Calendar
- `vaul` — Drawer
- `cmdk` — Command palette
- `@base-ui/react` sub-packages as needed (accordion, collapsible, etc.)

---

### 4. Conflict Handling (Existing Components)

**Decision**: Overwrite all 8 existing component files (clarification Q1 answer: B)

**Rationale**: Fresh shadcn defaults are preferred over the current customized versions. The `--overwrite` flag enables this. A git commit before the run preserves the pre-installation state for rollback if needed.

**Existing components that will be overwritten**:
`button.tsx`, `card.tsx`, `checkbox.tsx`, `dropdown-menu.tsx`, `input.tsx`, `label.tsx`, `skeleton.tsx`, `sonner.tsx`

**Risk mitigation**: Commit current state to git before running the command. This creates a safe rollback point.

---

### 5. Safety & Rollback Strategy

**Decision**: Commit current state before running the installation

**Rationale**: The `--overwrite` flag is destructive for existing files. A pre-run git commit on the `001-install-shadcn` branch gives a clean rollback point (`git checkout HEAD -- apps/web/src/components/ui/`) if the overwritten components break the app unexpectedly.

---

### 6. Regression Verification Strategy

**Decision**: Build check + manual spot-check of existing pages

**Rationale**: The constitution requires Playwright E2E coverage for critical journeys. Post-installation:
1. Run `pnpm build` to catch TypeScript/import errors
2. Run `pnpm dev:web` and manually verify: login page, sign-up page, dashboard, dropdown menus, form interactions
3. Run existing Playwright E2E suite if configured

**All NEEDS CLARIFICATION items**: None — all resolved via clarification session.
