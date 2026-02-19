import { create } from "zustand";
import type { FeatureFlagsStore, AnyFlag } from "../types";
import { SEED_PROJECTS, SEED_FLAGS } from "../types";

/**
 * Helper: Get all flags in a project that have parentId === targetParentId
 */
function getDirectChildren(flags: AnyFlag[], parentId: string): AnyFlag[] {
  return flags.filter((f) => f.parentId === parentId);
}

/**
 * Helper: Check if targetId is a descendant of ancestorId
 * (recursive walk through parentId chain)
 */
function hasDescendant(
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

export const useFeatureFlagsStore = create<FeatureFlagsStore>((set, get) => ({
  // Initial state
  projects: SEED_PROJECTS,
  selectedProjectId: SEED_PROJECTS[0].id,
  flags: SEED_FLAGS,
  sidebarOpen: true,
  collapsedFlagIds: new Set(),

  // Actions
  selectProject: (projectId) => set({ selectedProjectId: projectId }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  addFlag: (projectId, name, type, parentId = null) =>
    set((state) => {
      const now = new Date();
      const newFlag = {
        id: crypto.randomUUID(),
        name: name.trim(),
        type,
        value: false, // default for boolean
        parentId: parentId ?? null,
        createdAt: now,
        updatedAt: now,
      };
      return {
        flags: {
          ...state.flags,
          [projectId]: [...(state.flags[projectId] ?? []), newFlag],
        },
      };
    }),

  updateFlag: (projectId, flagId, updates) =>
    set((state) => {
      const projectFlags = state.flags[projectId] ?? [];
      const flag = projectFlags.find((f) => f.id === flagId);

      // Guard: prevent type change if flag has children
      if (
        flag &&
        updates.type &&
        updates.type !== flag.type &&
        flag.type === "boolean"
      ) {
        const children = getDirectChildren(projectFlags, flagId);
        if (children.length > 0) {
          // Silently reject type change
          return state;
        }
      }

      return {
        flags: {
          ...state.flags,
          [projectId]: projectFlags.map((f) =>
            f.id === flagId ? { ...f, ...updates, updatedAt: new Date() } : f
          ),
        },
      };
    }),

  toggleFlagValue: (projectId, flagId) =>
    set((state) => ({
      flags: {
        ...state.flags,
        [projectId]: (state.flags[projectId] ?? []).map((f) =>
          f.id === flagId && f.type === "boolean"
            ? { ...f, value: !f.value, updatedAt: new Date() }
            : f
        ),
      },
    })),

  deleteFlag: (projectId, flagId) =>
    set((state) => {
      const projectFlags = state.flags[projectId] ?? [];
      // Promote direct children to root
      const newFlags = projectFlags
        .filter((f) => f.id !== flagId)
        .map((f) =>
          f.parentId === flagId ? { ...f, parentId: null } : f
        );

      // Remove from collapsedFlagIds
      const newCollapsedFlagIds = new Set(state.collapsedFlagIds);
      newCollapsedFlagIds.delete(flagId);

      return {
        flags: {
          ...state.flags,
          [projectId]: newFlags,
        },
        collapsedFlagIds: newCollapsedFlagIds,
      };
    }),

  setFlagParent: (projectId, flagId, parentId) =>
    set((state) => {
      const projectFlags = state.flags[projectId] ?? [];
      const flag = projectFlags.find((f) => f.id === flagId);
      const targetParent = parentId
        ? projectFlags.find((f) => f.id === parentId)
        : null;

      // Validation: parentId must be null or reference an existing boolean flag
      if (parentId !== null && (!targetParent || targetParent.type !== "boolean")) {
        return state; // Silently reject
      }

      // Validation: target parent must not be a descendant of flagId (cycle check)
      if (parentId && hasDescendant(projectFlags, flagId, parentId)) {
        return state; // Silently reject
      }

      // Update parentId
      if (!flag) return state;

      const newFlags = projectFlags.map((f) =>
        f.id === flagId ? { ...f, parentId, updatedAt: new Date() } : f
      );

      return {
        flags: {
          ...state.flags,
          [projectId]: newFlags,
        },
      };
    }),

  toggleFlagCollapsed: (flagId) =>
    set((state) => {
      const newCollapsedFlagIds = new Set(state.collapsedFlagIds);
      if (newCollapsedFlagIds.has(flagId)) {
        newCollapsedFlagIds.delete(flagId);
      } else {
        newCollapsedFlagIds.add(flagId);
      }
      return { collapsedFlagIds: newCollapsedFlagIds };
    }),
}));
