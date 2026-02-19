# fluttering Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-19

## Active Technologies
- TypeScript 5.x strict mode, React 19.x + Zustand 5.x (new, to be installed), shadcn/ui (existing), Lucide React (existing), date-fns v4 (existing), TanStack Router v1 (existing) (002-feature-flags)
- None — in-memory Zustand store only; no persistence (002-feature-flags)
- TypeScript 5.x, strict mode, no `any` + React 19.x, Zustand 5.x, Tailwind CSS v4, shadcn/ui, Lucide React, TanStack Router v1 (003-flag-groups)
- In-memory Zustand store only (no Prisma/SQLite changes for this feature) (003-flag-groups)
- TypeScript 5.x, strict mode, no `any` + React 19.x, Zustand 5.x, Tailwind CSS v4, shadcn/ui, Lucide React, TanStack Router v1, `@dnd-kit/react` + `@dnd-kit/utilities` (new — drag-and-drop) (003-flag-groups)
- TypeScript 5.x, strict mode, no `any` + React 19.x, Zustand 5.x, @dnd-kit/react (existing), @dnd-kit/helpers (may need install), shadcn/ui (Dialog, Command, Popover, Select — check which are already installed), Lucide React (existing) (004-enum-flag-types)
- In-memory Zustand store only — no Prisma/SQLite changes (004-enum-flag-types)

- TypeScript 5.x, strict mode + React 19.x, shadcn CLI 3.6.2, `@base-ui/react`, Tailwind CSS v4, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` (001-install-shadcn)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x, strict mode: Follow standard conventions

## Recent Changes
- 004-enum-flag-types: Added TypeScript 5.x, strict mode, no `any` + React 19.x, Zustand 5.x, @dnd-kit/react (existing), @dnd-kit/helpers (may need install), shadcn/ui (Dialog, Command, Popover, Select — check which are already installed), Lucide React (existing)
- 003-flag-groups: Added TypeScript 5.x, strict mode, no `any` + React 19.x, Zustand 5.x, Tailwind CSS v4, shadcn/ui, Lucide React, TanStack Router v1, `@dnd-kit/react` + `@dnd-kit/utilities` (new — drag-and-drop)
- 003-flag-groups: Added TypeScript 5.x, strict mode, no `any` + React 19.x, Zustand 5.x, Tailwind CSS v4, shadcn/ui, Lucide React, TanStack Router v1


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
