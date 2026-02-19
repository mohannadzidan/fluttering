import type { AnyFlag } from "../types";

/**
 * Represents a flag in the render list with tree metadata
 */
export interface FlagRenderNode {
  flag: AnyFlag;
  depth: number;
  isLastChild: boolean;
  hasChildren: boolean;
  ancestorIsLastChild: boolean[];
}

/**
 * Get direct children of a parent flag
 * @param flags All flags in the project
 * @param parentId The parent flag's ID
 * @returns Array of flags whose parentId matches
 */
export function getDirectChildren(flags: AnyFlag[], parentId: string): AnyFlag[] {
  return flags.filter((f) => f.parentId === parentId);
}

/**
 * Check if a target flag is a descendant of an ancestor flag
 * Used for cycle detection in setFlagParent
 * @param flags All flags in the project
 * @param ancestorId The potential ancestor flag's ID
 * @param targetId The flag to check for in the ancestry chain
 * @returns true if targetId is a descendant of ancestorId
 */
export function hasDescendant(
  flags: AnyFlag[],
  ancestorId: string,
  targetId: string
): boolean {
  const children = getDirectChildren(flags, ancestorId);
  return children.some((child) => {
    if (child.id === targetId) return true;
    return hasDescendant(flags, child.id, targetId);
  });
}

/**
 * Build a flat, ordered render list from a hierarchical flag structure
 * Performs depth-first tree walk, skips collapsed subtrees
 * @param flags All flags in the project (flat array with parentId references)
 * @param collapsedFlagIds Set of flag IDs that are currently collapsed
 * @returns Flat ordered array with tree metadata for each node
 */
export function buildRenderList(
  flags: AnyFlag[],
  collapsedFlagIds: Set<string>
): FlagRenderNode[] {
  const result: FlagRenderNode[] = [];

  // Find root flags (parentId === null)
  const rootFlags = flags.filter((f) => f.parentId === null);

  /**
   * Recursive walk to build the render list
   */
  function walkTree(
    flag: AnyFlag,
    depth: number,
    parentChildren: AnyFlag[],
    ancestorIsLastChild: boolean[]
  ): void {
    // Determine if this is the last child of its parent
    const isLastChild = parentChildren[parentChildren.length - 1]?.id === flag.id;

    // Check if flag has children
    const children = getDirectChildren(flags, flag.id);
    const hasChildren = children.length > 0;

    // Add this flag to the render list
    result.push({
      flag,
      depth,
      isLastChild,
      hasChildren,
      ancestorIsLastChild: [...ancestorIsLastChild],
    });

    // If collapsed or no children, skip children rendering
    if (!hasChildren || collapsedFlagIds.has(flag.id)) {
      return;
    }

    // Recursively walk children
    const newAncestorIsLastChild = [...ancestorIsLastChild, isLastChild];
    children.forEach((child) => {
      walkTree(child, depth + 1, children, newAncestorIsLastChild);
    });
  }

  // Walk root flags
  rootFlags.forEach((flag) => {
    walkTree(flag, 0, rootFlags, []);
  });

  return result;
}
