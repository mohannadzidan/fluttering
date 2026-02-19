import { create } from "zustand";
import type { FeatureFlagsStore } from "../types";
import { SEED_PROJECTS, SEED_FLAGS } from "../types";

export const useFeatureFlagsStore = create<FeatureFlagsStore>((set) => ({
  // Initial state
  projects: SEED_PROJECTS,
  selectedProjectId: SEED_PROJECTS[0].id,
  flags: SEED_FLAGS,
  sidebarOpen: true,

  // Actions
  selectProject: (projectId) => set({ selectedProjectId: projectId }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  addFlag: (projectId, name, type) =>
    set((state) => {
      const now = new Date();
      const newFlag = {
        id: crypto.randomUUID(),
        name: name.trim(),
        type,
        value: false, // default for boolean
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
    set((state) => ({
      flags: {
        ...state.flags,
        [projectId]: (state.flags[projectId] ?? []).map((f) =>
          f.id === flagId ? { ...f, ...updates, updatedAt: new Date() } : f
        ),
      },
    })),

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
    set((state) => ({
      flags: {
        ...state.flags,
        [projectId]: (state.flags[projectId] ?? []).filter((f) => f.id !== flagId),
      },
    })),
}));
