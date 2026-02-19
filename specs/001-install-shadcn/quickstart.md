# Quickstart: shadcn/ui Complete Component Library Setup

**Feature**: 001-install-shadcn | **Branch**: `001-install-shadcn`

## Prerequisites

- Node.js and pnpm installed
- `apps/web` has `components.json` present (already committed)
- You are on branch `001-install-shadcn`

## Installation Steps

### Step 1 — Safety Checkpoint

Commit the current state before running the destructive overwrite:

```bash
git add apps/web/src/components/ui/
git commit -m "chore: snapshot ui components before shadcn full install"
```

### Step 2 — Run the Installation

From the repo root:

```bash
cd apps/web
pnpm shadcn add --all --yes --overwrite
```

> This command will:
> - Add all standard shadcn/ui components to `src/components/ui/`
> - Overwrite the 8 existing component files with fresh defaults
> - Auto-install any missing peer dependencies into `apps/web/package.json`
> - Use the configured `base-lyra` style (components backed by `@base-ui/react`)

After the command completes, return to the repo root:

```bash
cd ../..
```

### Step 3 — Sync Workspace Dependencies

Since the CLI may have modified `apps/web/package.json`, re-install from the monorepo root:

```bash
pnpm install
```

### Step 4 — Verify the Build

```bash
pnpm build
```

Expected: zero errors. If TypeScript errors appear, check the overwritten component files for API shape changes (most likely in `button.tsx` or `dropdown-menu.tsx`).

### Step 5 — Regression Check

Start the dev server and verify existing pages:

```bash
pnpm dev:web
```

Manually verify these pages and interactions:

| Page | What to check |
|------|--------------|
| `/login` | Form renders, input fields work, button submits |
| Sign-up page | Form renders, checkbox works, submit fires |
| Dashboard | Cards render, skeleton states work |
| Any dropdown | Dropdown menu opens and items are selectable |

### Step 6 — Commit the Result

```bash
git add apps/web/src/components/ui/ apps/web/package.json pnpm-lock.yaml
git commit -m "feat: add all shadcn/ui standard components"
```

## Using Components

All components are importable via the `@/components/ui` alias:

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
```

## Rollback

If the overwritten components break the app and cannot be fixed quickly:

```bash
# Restore all ui component files to pre-installation state
git checkout HEAD~1 -- apps/web/src/components/ui/
pnpm install
```
