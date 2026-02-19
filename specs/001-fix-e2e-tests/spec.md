# Feature Specification: Fix Frontend E2E Tests

**Feature Branch**: `001-fix-e2e-tests`
**Created**: 2026-02-20
**Status**: Draft
**Input**: User description: "we need to fix all e2e tests in the frontend"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - E2E Test Suite Runs Green (Priority: P1)

A developer runs the full Playwright E2E test suite and all tests pass reliably across all browsers. Currently the tests for the enum flag types feature (T019–T023) fail due to selector mismatches, missing state isolation between tests, and UI interaction patterns that don't match the actual rendered components.

**Why this priority**: A failing E2E test suite provides no safety net. Developers cannot ship with confidence, and the tests undermine trust in the CI pipeline.

**Independent Test**: Can be verified by running the Playwright test suite and observing zero failures across all five test cases (T019–T023).

**Acceptance Scenarios**:

1. **Given** the frontend dev server is running, **When** a developer runs the full Playwright E2E suite, **Then** all five tests (T019–T023) pass in Chromium, Firefox, and WebKit with zero flaky retries.
2. **Given** a test creates enum types and flags, **When** the next test begins, **Then** the application state is reset to the initial empty state so tests do not interfere with each other.
3. **Given** the test selects a UI element by its accessible role or label, **When** that element exists in the DOM with the correct role, **Then** the selector resolves to exactly one matching element without ambiguity.

---

### User Story 2 - Test Selectors Match Real UI Elements (Priority: P2)

A developer reading the test file can understand which UI element each selector targets, and those selectors continue to work even as minor styling or structure changes are made.

**Why this priority**: Fragile selectors are the primary source of false-negative test failures. Fixing selectors to target stable identifiers (accessible labels, roles, test IDs) makes the suite maintainable.

**Independent Test**: Each locator in the test file resolves to exactly one visible element during a manual run, with no selector timeouts.

**Acceptance Scenarios**:

1. **Given** a button exists with the accessible label "Manage Types", **When** the test clicks it, **Then** the type picker popover opens without timeout errors.
2. **Given** the enum type modal is open, **When** the test looks for the "Name" input and "Add value" button, **Then** both resolve correctly to their respective elements.
3. **Given** an enum type row is visible in the type picker, **When** the test targets its edit action, **Then** the selector resolves to the pencil icon button with its aria-label rather than searching for visible text "Edit".

---

### User Story 3 - Test State Isolation (Priority: P3)

Each test starts from a clean application state: no flags, no enum types, and no in-progress creation rows.

**Why this priority**: Without state isolation, a passing test can corrupt state that causes a later test to fail non-deterministically.

**Independent Test**: Run only T021 in isolation and observe it passes; then run T019 followed by T021 and observe T021 still passes.

**Acceptance Scenarios**:

1. **Given** T019 created an "Environment" enum type and a "MyEnumFlag" flag, **When** T020 begins, **Then** neither the "Environment" type nor "MyEnumFlag" appear in the application.
2. **Given** a test is starting, **When** the `beforeEach` hook runs, **Then** the page is navigated and the app state is confirmed empty before any interactions occur.

---

### Edge Cases

- What happens when a test tries to click a popover-based type picker that the previous test left open?
- How does the suite handle tests that need to create an enum type as a prerequisite without duplicating that setup across multiple tests?
- What happens when the confirmation dialog text has dynamic content (flag counts) that doesn't exactly match a hard-coded pattern?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each E2E test MUST begin with a clean application state — no pre-existing flags or enum types from previous test runs.
- **FR-002**: Selectors targeting the type picker (Popover component) MUST use the correct role or a stable `data-testid` attribute rather than `[role="dialog"]`, which the Popover does not render.
- **FR-003**: Selectors targeting the edit icon button in the type picker manage mode MUST resolve via `aria-label` (e.g., `aria-label="Edit Environment"`) rather than visible inner text "Edit".
- **FR-004**: The confirmation dialog for value removal MUST be matchable by its visible heading text ("Confirm value removal") rather than a regex matching a substring of the body text.
- **FR-005**: The confirmation dialog for enum type deletion MUST be matchable by its visible heading text ("Delete enum type?").
- **FR-006**: Selectors for the "Add new flag..." button MUST match its full or partial text as rendered, including with the icon present.
- **FR-007**: The test for T022 (inline creation row gates) MUST locate the "Create" button relative to the creation row element, not as a global page query that could match buttons outside the row.
- **FR-008**: All tests MUST handle the timing of popover open/close transitions by waiting for the popover content to be visible before interacting with items inside it.
- **FR-009**: Where the UI uses `data-testid` attributes, tests MUST prefer those selectors to reduce coupling to rendered text and DOM structure.

### Key Entities

- **E2E Test Suite**: The set of Playwright test files in `apps/web/e2e/` targeting the enum flag types feature (T019–T023).
- **Type Picker Popover**: A shadcn/ui `Popover` + `Command` component that opens from the "Manage Types" button or the "+ Type" selector in the creation row — does not render with `role="dialog"`.
- **Enum Type Modal**: A shadcn/ui `Dialog` component for creating or editing enum types — renders with `role="dialog"`.
- **Alert Dialog**: A shadcn/ui `AlertDialog` for confirming destructive actions (value removal, type deletion) — renders with `role="alertdialog"`.
- **Flag Creation Row**: An inline `<li>` element containing a name input, type picker trigger, and "Create" button — not a dialog.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All five E2E tests (T019–T023) pass with zero failures across all configured browsers (Chromium, Firefox, WebKit) in a single CI run.
- **SC-002**: The test suite completes without any test requiring the `retries` fallback to pass — i.e., zero flaky tests.
- **SC-003**: Running the suite twice consecutively produces identical results, confirming full state isolation between test files and individual tests.
- **SC-004**: Each individual test can be run in isolation (`--grep "T019"`, etc.) and still passes, confirming no hidden dependencies between tests.

## Assumptions

- The application is served at `http://localhost:3001` during test runs (existing `playwright.config.ts` setting).
- The Zustand store is in-memory only and resets naturally when the page is reloaded — the `beforeEach` `page.goto('/')` is sufficient to reset state if the app does not persist state to `localStorage` or `sessionStorage`.
- The fix scope is limited to the test files themselves (`apps/web/e2e/`) and adding `data-testid` attributes to components where needed — no functional behavior of the application changes.
- The TypePicker Popover component does not carry `role="dialog"` on its content element; if it does, the analysis should be updated accordingly.
