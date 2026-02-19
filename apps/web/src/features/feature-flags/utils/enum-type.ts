import type { EnumType, AnyFlag } from "../types";

/**
 * Check if a name is unique among existing enum types (case-insensitive comparison).
 * @param name The name to check
 * @param existing Array of existing enum types
 * @param excludeId If provided, ignore this enum type's name (for edit mode)
 * @returns true if the name is unique (or matches only the excluded ID)
 */
export function isNameUnique(
  name: string,
  existing: EnumType[],
  excludeId?: string
): boolean {
  const lowerName = name.toLowerCase();
  return !existing.some(
    (et) => et.id !== excludeId && et.name.toLowerCase() === lowerName
  );
}

/**
 * Check if all values in the list are unique (case-sensitive comparison).
 * @param values Array of values to check
 * @returns true if all values are unique
 */
export function areValuesUnique(values: string[]): boolean {
  return new Set(values).size === values.length;
}

/**
 * Count the total number of EnumFlags referencing a specific enum type across all projects.
 * @param enumTypeId The enum type ID to search for
 * @param flags Record mapping projectId to flag arrays
 * @returns Count of matching EnumFlags
 */
export function getAffectedFlagCount(
  enumTypeId: string,
  flags: Record<string, AnyFlag[]>
): number {
  let count = 0;
  for (const projectId in flags) {
    count += flags[projectId].filter(
      (f) => f.type === "enum" && f.enumTypeId === enumTypeId
    ).length;
  }
  return count;
}

/**
 * Count the number of EnumFlags using a specific value for a specific enum type.
 * @param enumTypeId The enum type ID to search for
 * @param value The specific value to count
 * @param flags Record mapping projectId to flag arrays
 * @returns Count of matching EnumFlags with that value
 */
export function getAffectedFlagsByValue(
  enumTypeId: string,
  value: string,
  flags: Record<string, AnyFlag[]>
): number {
  let count = 0;
  for (const projectId in flags) {
    count += flags[projectId].filter(
      (f) => f.type === "enum" && f.enumTypeId === enumTypeId && f.value === value
    ).length;
  }
  return count;
}

/**
 * Check if removing a specific value from an enum type would affect any flags.
 * @param enumTypeId The enum type ID
 * @param removedValue The value being removed
 * @param flags Record mapping projectId to flag arrays
 * @returns true if at least one flag currently holds this value
 */
export function wouldRemoveUsedValue(
  enumTypeId: string,
  removedValue: string,
  flags: Record<string, AnyFlag[]>
): boolean {
  for (const projectId in flags) {
    if (
      flags[projectId].some(
        (f) =>
          f.type === "enum" &&
          f.enumTypeId === enumTypeId &&
          f.value === removedValue
      )
    ) {
      return true;
    }
  }
  return false;
}
