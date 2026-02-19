# Feature Specification: shadcn/ui Complete Component Library Setup

**Feature Branch**: `001-install-shadcn`
**Created**: 2026-02-19
**Status**: Complete
**Input**: User description: "install shadcn and add all their component into this project"

## Context

The web app (`apps/web`) already has shadcn configured via `components.json` and a subset of components installed (button, card, checkbox, dropdown-menu, input, label, skeleton, sonner). This feature expands the installation to include every component available in the shadcn/ui component registry so developers have the full library available without needing to add components individually.

## Clarifications

### Session 2026-02-19

- Q: When a component file already exists in `apps/web/src/components/ui/`, what should happen during installation? → A: Overwrite all existing files with fresh shadcn defaults (reset any customizations).
- Q: Which categories of shadcn/ui registry items should be included? → A: Standard UI components only (e.g., accordion, dialog, table) — chart components and block layouts are excluded.
- Q: How should missing peer dependencies (e.g., Radix UI primitives) be handled? → A: Install all required peer dependencies automatically as part of the component installation run.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Access the Full Component Library (Priority: P1)

As a developer building features in the web app, I want all shadcn/ui components pre-installed so I can import any component directly without running additional setup commands.

**Why this priority**: The foundational value of this feature — every subsequent UI development task depends on components being available. Without this, developers must add components one by one, slowing development.

**Independent Test**: Open the project and attempt to import any shadcn/ui component (e.g., `Dialog`, `Accordion`, `DataTable`) directly from `@/components/ui`. The import succeeds and the component renders correctly in a test page.

**Acceptance Scenarios**:

1. **Given** the project is cloned and dependencies are installed, **When** a developer imports any shadcn/ui component from `@/components/ui`, **Then** the import resolves without errors and the component is available for use.
2. **Given** the full component library is installed, **When** the project is built, **Then** the build completes successfully with no missing module errors.
3. **Given** the components are installed, **When** a developer views the component files in `apps/web/src/components/ui/`, **Then** all standard shadcn/ui components are present as individual files.

---

### User Story 2 - Components Render with Consistent Styling (Priority: P2)

As a developer, I want all installed components to render with the project's existing design tokens (colors, typography, spacing) so the UI looks cohesive without extra configuration.

**Why this priority**: Components that install successfully but render incorrectly or with broken styles defeat the purpose of having them. This ensures the library is immediately usable.

**Independent Test**: Render a sample page containing several diverse components (e.g., a dialog, a data table, a date picker, a command palette). All components display with correct theming matching the existing button and card components.

**Acceptance Scenarios**:

1. **Given** a component is imported and rendered, **When** the page is viewed in both light and dark modes, **Then** the component applies the project's CSS variables correctly and matches the visual style of existing components.
2. **Given** multiple components are used together on a page, **When** the page is rendered, **Then** there are no style conflicts or visual inconsistencies between components.

---

### User Story 3 - App Remains Functional After Full Overwrite (Priority: P3)

As a developer, I want the existing app pages and features to continue working after all components are replaced with fresh shadcn defaults, so the overwrite doesn't silently break the running application.

**Why this priority**: Overwriting existing components (button, card, etc.) with fresh defaults may change prop signatures or class names that existing pages depend on. Regression validation is necessary to confirm the app is still operational.

**Independent Test**: After installing all components with overwrite, run the app and visit all existing pages (sign-in, sign-up, home). All pages render without runtime errors and core interactions (form submission, navigation, dropdowns) work correctly.

**Acceptance Scenarios**:

1. **Given** all components have been overwritten with fresh shadcn defaults, **When** the app is started and existing pages are visited, **Then** no runtime errors occur and pages render visually correctly.
2. **Given** the full component library is installed with overwrite, **When** the project is built, **Then** the build completes with zero TypeScript or module resolution errors.

---

### Edge Cases

- What happens if a component name conflicts with an existing custom component outside the `ui/` directory?
- What if a component name conflicts with an existing custom component outside the `ui/` directory?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All standard shadcn/ui UI components (e.g., accordion, alert, badge, calendar, command, dialog, drawer, form, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, slider, switch, table, tabs, textarea, toggle, tooltip, and all similar primitives) MUST be added to `apps/web/src/components/ui/`. Chart components and Block layout sections are explicitly out of scope.
- **FR-002**: The existing `components.json` configuration MUST remain the authoritative configuration and not be replaced.
- **FR-003**: All required peer dependencies for every added component (e.g., Radix UI primitives, date libraries) MUST be installed automatically into the web app's `package.json` as part of the component installation process, without requiring manual developer intervention.
- **FR-004**: Each component file MUST be independently importable via the `@/components/ui` alias.
- **FR-005**: All component files MUST be written with fresh shadcn defaults, overwriting any previously customized versions in `apps/web/src/components/ui/`.
- **FR-006**: All components MUST integrate with the project's existing Tailwind CSS v4 configuration and CSS variable-based theming.
- **FR-007**: Components that depend on shared utilities (e.g., `cn()` helper) MUST reference the existing utility file at `@/lib/utils`.

### Assumptions

- The shadcn CLI (already installed as `shadcn@^3.6.2`) will be used to add components.
- The project uses Tailwind CSS v4 and CSS variables for theming, as evidenced by the existing setup.
- "All components" means all standard UI primitive components listed in the official shadcn/ui registry at the time of installation. Chart components and Block layout sections are excluded.
- The `apps/web` workspace is the sole target; native/server apps are out of scope.
- Components not compatible with React 19 or the current shadcn style (`base-lyra`) are excluded from scope.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of standard shadcn/ui registry components are present as files in `apps/web/src/components/ui/` after installation.
- **SC-002**: The project builds successfully (`pnpm build`) with zero missing module or unresolved import errors after all components are added.
- **SC-003**: All previously working pages and features continue to function without regression after the new components are added.
- **SC-004**: Any component from the installed library can be imported and rendered on a page within 5 minutes of a developer starting work, with no additional setup required.
- **SC-005**: Light mode and dark mode styling applies correctly to all newly added components, consistent with existing components.
