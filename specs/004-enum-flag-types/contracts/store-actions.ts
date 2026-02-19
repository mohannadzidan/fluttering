/**
 * Store Action Contracts — Enum Flag Types (004)
 *
 * This file defines the TypeScript interfaces for all new and modified
 * Zustand store actions introduced by this feature.
 *
 * These are design-time contracts only — not executable code.
 * The implementation lives in:
 *   apps/web/src/features/feature-flags/store/index.ts
 *   apps/web/src/features/feature-flags/types/index.ts
 */

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------

export interface EnumType {
  id: string;
  /** Display name; unique across all enum types (case-insensitive). */
  name: string;
  /**
   * Ordered list of allowed values. Minimum length: 1.
   * Values are unique within the list (case-sensitive).
   * values[0] is the implicit default value.
   */
  values: string[];
}

export interface BooleanFlag {
  id: string;
  name: string;
  type: "boolean";
  value: boolean;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnumFlag {
  id: string;
  name: string;
  type: "enum";
  /** References EnumType.id. */
  enumTypeId: string;
  /** Current value — must always be in EnumType.values. */
  value: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AnyFlag = BooleanFlag | EnumFlag;

// ---------------------------------------------------------------------------
// New Store State Fields
// ---------------------------------------------------------------------------

export interface EnumTypeStoreState {
  /** Global registry of all user-defined enum types. */
  enumTypes: EnumType[];
}

// ---------------------------------------------------------------------------
// New Store Actions — Enum Type Management
// ---------------------------------------------------------------------------

export interface EnumTypeActions {
  /**
   * Create a new enum type.
   *
   * Preconditions (enforced, no-op / error if violated):
   * - name must not be empty
   * - name must be unique across existing enum types (case-insensitive)
   * - values must contain at least 1 item
   * - values must be unique within the list (case-sensitive)
   *
   * Side effects: none (no flags are created/modified)
   */
  createEnumType: (name: string, values: string[]) => void;

  /**
   * Replace an enum type's name and values.
   *
   * Preconditions (enforced):
   * - id must reference an existing enum type
   * - name must be unique excluding self (case-insensitive)
   * - values must contain at least 1 item
   * - values must be unique within the list (case-sensitive)
   *
   * Side effects (automatic, no confirmation required in the store layer;
   * confirmation is handled in the UI before calling this action):
   * - Any EnumFlag referencing this type whose current value is not in the
   *   new values[] is reset to values[0].
   */
  updateEnumType: (id: string, name: string, values: string[]) => void;

  /**
   * Delete an enum type and cascade-delete all EnumFlags that reference it.
   *
   * Preconditions: id must reference an existing enum type.
   *
   * Side effects:
   * - All EnumFlags across all projects with enumTypeId === id are removed.
   * - Children of deleted EnumFlags are NOT affected (EnumFlags cannot have
   *   children; only BooleanFlags can be parents).
   *
   * Note: The UI must present a confirmation dialog with the affected flag
   * count BEFORE calling this action. The store performs the cascade without
   * further validation.
   */
  deleteEnumType: (id: string) => void;
}

// ---------------------------------------------------------------------------
// New Store Actions — Enum Flag Value
// ---------------------------------------------------------------------------

export interface EnumFlagActions {
  /**
   * Set the current value of an EnumFlag.
   *
   * Preconditions:
   * - flagId must reference an existing flag with type === "enum"
   * - value must be present in the flag's EnumType.values
   *
   * Side effects: flag.value is updated; flag.updatedAt is refreshed.
   * If value is not valid for the type, the action is a no-op.
   */
  setEnumFlagValue: (projectId: string, flagId: string, value: string) => void;
}

// ---------------------------------------------------------------------------
// Modified Existing Action — addFlag
// ---------------------------------------------------------------------------

export interface ModifiedFlagActions {
  /**
   * Create a new flag with an assigned type.
   *
   * Changes from existing signature:
   * - type now accepts "boolean" | "enum" (not the old FlagType union)
   * - enumTypeId is required when type === "enum"; ignored otherwise
   *
   * The "untyped" intermediate state exists only in FlagCreateRow local state
   * and is never passed to this action.
   *
   * Preconditions:
   * - When type === "enum": enumTypeId must reference an existing EnumType
   * - parentId (if provided) must reference an existing BooleanFlag
   */
  addFlag: (
    projectId: string,
    name: string,
    type: "boolean" | "enum",
    parentId?: string | null,
    enumTypeId?: string,
  ) => void;
}

// ---------------------------------------------------------------------------
// Selector Helpers (read-only, derived from store state)
// ---------------------------------------------------------------------------

export interface EnumTypeSelectors {
  /** Returns the EnumType for a given id, or undefined if not found. */
  getEnumType: (id: string) => EnumType | undefined;

  /** Returns all EnumFlags (across all projects) that reference a given enumTypeId. */
  getFlagsByEnumType: (enumTypeId: string) => { projectId: string; flag: EnumFlag }[];

  /** Returns all EnumFlags within a project that hold a specific value for a given enumTypeId. */
  getFlagsByEnumValue: (
    projectId: string,
    enumTypeId: string,
    value: string,
  ) => EnumFlag[];
}
