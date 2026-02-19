// ---------------------------------------------------------------------------
// Enum Type Entity
// ---------------------------------------------------------------------------

/**
 * A user-defined enum type that can be assigned to flags.
 * Enum types are global (not per-project) and referenced by enum flags via enumTypeId.
 */
export interface EnumType {
  /** UUID — generated with crypto.randomUUID() on creation */
  id: string;
  /** Display name; unique case-insensitive comparison */
  name: string;
  /** Ordered list of allowed values; case-sensitive unique; length >= 1 */
  values: string[];
  // values[0] is the implicit default value
}

// ---------------------------------------------------------------------------
// Flag Types (discriminated union)
// ---------------------------------------------------------------------------

/**
 * The set of supported flag value types.
 * Extend this union when adding new flag types.
 * Each new member requires corresponding icon, value-control, and default value.
 */
export type FlagType = "boolean" | "enum"; // | "string" | "number" | "json" (future)

// ---------------------------------------------------------------------------
// Feature Flag Variants (Discriminated Union)
// ---------------------------------------------------------------------------

/**
 * Ephemeral flag state during inline creation — exists only in UI local state.
 * Transitions to BooleanFlag or EnumFlag on Create. Never persisted to store.
 */
export interface UntypedFlag {
  id: string;
  name: string;
  type: "untyped";
  value: null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A boolean feature flag.
 * Uses a discriminated union keyed on `type: "boolean"` to ensure
 * `value` is always boolean.
 */
export interface BooleanFlag {
  /** UUID — generated with crypto.randomUUID() on creation */
  id: string;
  /** Display name — non-empty, not unique within a project */
  name: string;
  /** Flag type discriminator */
  type: "boolean";
  /** The flag's current value */
  value: boolean;
  /** ID of parent flag for hierarchy, or null for root-level flags */
  parentId: string | null;
  /** Set once on creation; never mutated */
  createdAt: Date;
  /** Refreshed on every value toggle or metadata update */
  updatedAt: Date;
}

/**
 * An enum feature flag.
 * Uses a discriminated union keyed on `type: "enum"` to ensure
 * enumTypeId and value are present and correctly typed.
 */
export interface EnumFlag {
  /** UUID — generated with crypto.randomUUID() on creation */
  id: string;
  /** Display name — non-empty, not unique within a project */
  name: string;
  /** Flag type discriminator */
  type: "enum";
  /** References EnumType.id */
  enumTypeId: string;
  /** Current value; must be in EnumType.values */
  value: string;
  /** ID of parent flag for hierarchy — must be null (enum flags cannot be parents) */
  parentId: string | null;
  /** Set once on creation; never mutated */
  createdAt: Date;
  /** Refreshed on every value change or metadata update */
  updatedAt: Date;
}

/** Union of all concrete persisted flag types (excludes UntypedFlag which is UI-only) */
export type AnyFlag = BooleanFlag | EnumFlag;

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

  /**
   * Set of flag IDs currently in collapsed state.
   * Used to hide children of parent flags in the UI.
   */
  collapsedFlagIds: Set<string>;

  /**
   * Global registry of enum types (not per-project).
   * Referenced by EnumFlags via enumTypeId.
   */
  enumTypes: EnumType[];
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
   * For boolean: sets value to false (default).
   * For enum: sets value to enumType.values[0] (default); enumTypeId must be provided.
   * Sets createdAt and updatedAt to the current timestamp.
   * Optional parentId makes the flag a child of an existing parent (default: null for root).
   */
  addFlag: (
    projectId: string,
    name: string,
    type: "boolean" | "enum",
    parentId?: string | null,
    enumTypeId?: string
  ) => void;

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
   * Direct children of deleted flag are promoted to root (parentId set to null).
   * Removes flagId from collapsedFlagIds.
   * Does nothing if flagId is not found.
   */
  deleteFlag: (projectId: string, flagId: string) => void;

  /**
   * Assign or reassign a flag's parent.
   * Validates: target parent must exist, be boolean type, and not be a descendant.
   * Silently rejects invalid assignments.
   */
  setFlagParent: (projectId: string, flagId: string, parentId: string | null) => void;

  /**
   * Toggle collapse state of a parent flag.
   * Adds flagId to collapsedFlagIds if not present, removes if present.
   */
  toggleFlagCollapsed: (flagId: string) => void;

  /**
   * Create a new enum type and add it to enumTypes.
   * Enforces: name uniqueness (case-insensitive), values.length >= 1, values uniqueness (case-sensitive).
   */
  createEnumType: (name: string, values: string[]) => void;

  /**
   * Update an existing enum type's name and/or values.
   * After update, any EnumFlag whose current value is no longer in the new values[]
   * is automatically reset to values[0] (the new default).
   * Enforces: name uniqueness (excluding self), values.length >= 1, values uniqueness.
   */
  updateEnumType: (id: string, name: string, values: string[]) => void;

  /**
   * Delete an enum type and all EnumFlags referencing it across all projects.
   */
  deleteEnumType: (id: string) => void;

  /**
   * Set the current value of an EnumFlag.
   * Validates: value must be in the flag's EnumType.values.
   * No-op if invalid.
   */
  setEnumFlagValue: (projectId: string, flagId: string, value: string) => void;
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
      parentId: null,
      createdAt: new Date("2026-02-10T10:00:00Z"),
      updatedAt: new Date("2026-02-18T14:30:00Z"),
    },
    {
      id: "flag-2",
      name: "new-checkout",
      type: "boolean",
      value: false,
      parentId: null,
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
      parentId: null,
      createdAt: new Date("2026-02-19T08:00:00Z"),
      updatedAt: new Date("2026-02-19T08:00:00Z"),
    },
  ],
};
