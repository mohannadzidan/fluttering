import { useFeatureFlagsStore } from "../store";

// Re-export the main store hook for use in components
export { useFeatureFlagsStore };

/**
 * Get the currently selected project ID.
 */
export function useSelectedProject() {
  return useFeatureFlagsStore((state) => state.selectedProjectId);
}

/**
 * Get the flags array for the currently selected project.
 */
export function useProjectFlags() {
  const selectedProjectId = useFeatureFlagsStore((state) => state.selectedProjectId);
  const flags = useFeatureFlagsStore((state) => state.flags[selectedProjectId] ?? []);
  return flags;
}

/**
 * Get all available projects.
 */
export function useProjects() {
  return useFeatureFlagsStore((state) => state.projects);
}

/**
 * Get the sidebar open/collapsed state.
 */
export function useSidebarOpen() {
  return useFeatureFlagsStore((state) => state.sidebarOpen);
}
