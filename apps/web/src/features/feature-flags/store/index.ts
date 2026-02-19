import { create } from "zustand";
import type { FeatureFlagsStore, AnyFlag, EnumType } from "../types";
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
  enumTypes: [],

  // Actions
  selectProject: (projectId) => set({ selectedProjectId: projectId }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  addFlag: (projectId, name, type, parentId = null, enumTypeId) =>
    set((state) => {
      const now = new Date();
      const trimmedName = name.trim();

      if (type === "boolean") {
        const newFlag = {
          id: crypto.randomUUID(),
          name: trimmedName,
          type: "boolean" as const,
          value: false,
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
      }

      if (type === "enum" && enumTypeId) {
        const enumType = state.enumTypes.find((et) => et.id === enumTypeId);
        if (!enumType || enumType.values.length === 0) return state;

        const newFlag = {
          id: crypto.randomUUID(),
          name: trimmedName,
          type: "enum" as const,
          enumTypeId,
          value: enumType.values[0],
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
      }

      return state;
    }),

  updateFlag: (projectId, flagId, updates) =>
    set((state) => {
      const projectFlags = state.flags[projectId] ?? [];
      const flag = projectFlags.find((f) => f.id === flagId);

      if (!flag) return state;

      // Guard: prevent type change if flag has children
      if (
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
          [projectId]: projectFlags.map((f) => {
            if (f.id === flagId) {
              const { name, type } = updates;
              return {
                ...f,
                ...(name !== undefined && { name }),
                ...(type !== undefined && { type }),
                updatedAt: new Date(),
              } as AnyFlag;
            }
            return f;
          }),
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

  createEnumType: (name, values) => {
    const state = get();
    const trimmedName = name.trim();

    // Guard: enforce name uniqueness (case-insensitive)
    if (
      state.enumTypes.some(
        (et) => et.name.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      return null;
    }

    // Guard: enforce values.length >= 1 and case-sensitive uniqueness
    if (values.length === 0) return null;
    if (new Set(values).size !== values.length) return null; // duplicates found

    const newEnumType: EnumType = {
      id: crypto.randomUUID(),
      name: trimmedName,
      values,
    };

    set({
      enumTypes: [...state.enumTypes, newEnumType],
    });

    return newEnumType.id;
  },

  updateEnumType: (id, name, values) =>
    set((state) => {
      const enumType = state.enumTypes.find((et) => et.id === id);
      if (!enumType) return state;

      const trimmedName = name.trim();

      // Guard: enforce name uniqueness (case-insensitive, excluding self)
      if (
        state.enumTypes.some(
          (et) =>
            et.id !== id &&
            et.name.toLowerCase() === trimmedName.toLowerCase()
        )
      ) {
        return state;
      }

      // Guard: enforce values.length >= 1 and case-sensitive uniqueness
      if (values.length === 0) return state;
      if (new Set(values).size !== values.length) return state;

      // Update the enum type
      const updatedEnumTypes = state.enumTypes.map((et) =>
        et.id === id
          ? { ...et, name: trimmedName, values }
          : et
      );

      // After updating values, reset any enum flags that hold removed values
      const updatedFlags = { ...state.flags };
      for (const projectId in updatedFlags) {
        updatedFlags[projectId] = updatedFlags[projectId].map((flag) => {
          if (
            flag.type === "enum" &&
            flag.enumTypeId === id &&
            !values.includes(flag.value)
          ) {
            return { ...flag, value: values[0], updatedAt: new Date() };
          }
          return flag;
        });
      }

      return {
        enumTypes: updatedEnumTypes,
        flags: updatedFlags,
      };
    }),

  deleteEnumType: (id) =>
    set((state) => {
      const hasType = state.enumTypes.some((et) => et.id === id);
      if (!hasType) return state;

      // Remove the enum type
      const updatedEnumTypes = state.enumTypes.filter((et) => et.id !== id);

      // Remove all enum flags referencing this type
      const updatedFlags = { ...state.flags };
      for (const projectId in updatedFlags) {
        updatedFlags[projectId] = updatedFlags[projectId].filter(
          (flag) => !(flag.type === "enum" && flag.enumTypeId === id)
        );
      }

      return {
        enumTypes: updatedEnumTypes,
        flags: updatedFlags,
      };
    }),

  setEnumFlagValue: (projectId, flagId, value) =>
    set((state) => {
      const projectFlags = state.flags[projectId] ?? [];
      const flag = projectFlags.find((f) => f.id === flagId);

      // Guard: flag must exist and be enum type
      if (!flag || flag.type !== "enum") return state;

      // Guard: value must be in the enum type's values
      const enumType = state.enumTypes.find((et) => et.id === flag.enumTypeId);
      if (!enumType || !enumType.values.includes(value)) return state;

      return {
        flags: {
          ...state.flags,
          [projectId]: projectFlags.map((f) =>
            f.id === flagId && f.type === "enum"
              ? { ...f, value, updatedAt: new Date() }
              : f
          ),
        },
      };
    }),
}));
