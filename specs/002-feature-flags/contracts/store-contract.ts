/**
 * Feature Flags Store Contract
 * ============================
 * Canonical TypeScript type definitions for the feature-flags Zustand store.
 * This file is the source of truth for all types in this feature.
 *
 * Location in codebase: apps/web/src/features/feature-flags/types/index.ts
 * (this contract file is copied to the feature during implementation)
 *
 * Constitution compliance:
 *   - Principle II: Feature-Based Architecture — types live inside the feature folder
 *   - Principle IV: State Isolation — one store, one feature
 *   - Principle III: N/A — no network communication
 */

// ---------------------------------------------------------------------------
// Flag Types (extensible discriminated union)
// ---------------------------------------------------------------------------

/**
 * The set of supported flag value types.
 * Extend this union when adding new flag types.
 * Each new member requires corresponding icon, value-control, and default value.
 */
export type FlagType = "boolean"; // | "string" | "number" | "json" (future)

/**
 * Maps a FlagType to its concrete value type.
 * Provides type-safe value access without runtime casting.
 */
export type FlagValue<T extends FlagType> = T extends "boolean" ? boolean : never;

// ---------------------------------------------------------------------------
// Feature Flag Entity
// ---------------------------------------------------------------------------

/**
 * A single feature flag entry within a project.
 * Uses a discriminated union keyed on `type` to ensure
 * `value` is always typed correctly for its flag type.
 */
export interface FeatureFlag<T extends FlagType = FlagType> {
  /** UUID — generated with crypto.randomUUID() on creation */
  id: string;
  /** Display name — non-empty, not unique within a project */
  name: string;
  /** Flag type — discriminates the `value` field's TypeScript type */
  type: T;
  /** The flag's current value — type-safe via FlagValue<T> */
  value: FlagValue<T>;
  /** Set once on creation; never mutated */
  createdAt: Date;
  /** Refreshed on every value toggle or metadata update */
  updatedAt: Date;
}

/** Convenience alias for boolean flags (the only implemented type) */
export type BooleanFlag = FeatureFlag<"boolean">;

/** Union of all concrete flag types (for runtime use in arrays/records) */
export type AnyFlag = BooleanFlag; // Expand to: BooleanFlag | StringFlag | ... (future)

// ---------------------------------------------------------------------------
// Project Entity
// ---------------------------------------------------------------------------

/**
 * A named container grouping a set of feature flags.
 * Projects are predefined in seed data; CRUD is out of scope for this feature.
 */
export interface Project {
  /** UUID — static, seeded at store initialization */
  id: string;
  /** Display name shown in the project selector dropdown */
  name: string;
}

// ---------------------------------------------------------------------------
// Store State
// ---------------------------------------------------------------------------

export interface FeatureFlagsState {
  /** Ordered list of available projects (seeded at startup) */
  projects: Project[];

  /**
   * ID of the currently selected project.
   * Defaults to the first project's ID from `projects`.
   */
  selectedProjectId: string;

  /**
   * Map from projectId to that project's ordered list of flags.
   * Flags are appended in creation order.
   */
  flags: Record<string, AnyFlag[]>;

  /**
   * Sidebar collapsed/expanded state.
   * true = expanded (default), false = collapsed.
   */
  sidebarOpen: boolean;
}

// ---------------------------------------------------------------------------
// Store Actions
// ---------------------------------------------------------------------------

export interface FeatureFlagsActions {
  /**
   * Switch the active project. Clears any in-progress inline create/edit rows
   * in the UI (handled at component level via key prop).
   */
  selectProject: (projectId: string) => void;

  /** Expand or collapse the sidebar */
  setSidebarOpen: (open: boolean) => void;

  /**
   * Create a new flag and append it to the project's flag list.
   * Sets value to the type-appropriate default (false for boolean).
   * Sets createdAt and updatedAt to the current timestamp.
   * @throws Never — pure state mutation; validation is a UI concern.
   */
  addFlag: (projectId: string, name: string, type: FlagType) => void;

  /**
   * Update a flag's name and/or type.
   * Refreshes updatedAt to the current timestamp.
   * Does nothing if flagId is not found in the project.
   */
  updateFlag: (
    projectId: string,
    flagId: string,
    updates: { name?: string; type?: FlagType }
  ) => void;

  /**
   * Toggle a boolean flag's value (true → false, false → true).
   * Refreshes updatedAt to the current timestamp.
   * Only applicable to boolean flags; no-op for other types.
   */
  toggleFlagValue: (projectId: string, flagId: string) => void;

  /**
   * Remove a flag from the project's list.
   * Does nothing if flagId is not found.
   */
  deleteFlag: (projectId: string, flagId: string) => void;
}

// ---------------------------------------------------------------------------
// Combined Store Type
// ---------------------------------------------------------------------------

/** The complete Zustand store type (state + actions) */
export type FeatureFlagsStore = FeatureFlagsState & FeatureFlagsActions;

// ---------------------------------------------------------------------------
// Seed Data (initial store state)
// ---------------------------------------------------------------------------

/**
 * Seed projects for initial state.
 * Replace or extend these in the store implementation as needed.
 */
export const SEED_PROJECTS: Project[] = [
  { id: "proj-1", name: "Production" },
  { id: "proj-2", name: "Staging" },
];

/**
 * Seed flags for initial state.
 * Dates are set at module evaluation time; they will be stable for the session.
 */
export const SEED_FLAGS: Record<string, AnyFlag[]> = {
  "proj-1": [
    {
      id: "flag-1",
      name: "dark-mode",
      type: "boolean",
      value: true,
      createdAt: new Date("2026-02-10T10:00:00Z"),
      updatedAt: new Date("2026-02-18T14:30:00Z"),
    },
    {
      id: "flag-2",
      name: "new-checkout",
      type: "boolean",
      value: false,
      createdAt: new Date("2026-02-15T09:00:00Z"),
      updatedAt: new Date("2026-02-15T09:00:00Z"),
    },
  ],
  "proj-2": [
    {
      id: "flag-3",
      name: "beta-dashboard",
      type: "boolean",
      value: false,
      createdAt: new Date("2026-02-19T08:00:00Z"),
      updatedAt: new Date("2026-02-19T08:00:00Z"),
    },
  ],
};

// ---------------------------------------------------------------------------
// Icon Mapping (documentation — implemented in flag-type-icon.tsx)
// ---------------------------------------------------------------------------

/**
 * Icon mapping for flag types (Lucide React).
 * Used as reference for the FlagTypeIcon component.
 *
 * boolean  → ToggleRight
 * string   → Quote       (future)
 * number   → Hash        (future)
 * json     → Braces      (future)
 *
 * Timestamp icons:
 * createdAt → CalendarPlus
 * updatedAt → CalendarClock
 */
