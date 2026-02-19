import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFeatureFlagsStore } from "../../hooks/use-flags-store";
import { useProjects, useSelectedProject } from "../../hooks/use-flags-store";

/**
 * Project selector dropdown.
 * Populated from the projects in the Zustand store.
 * Clicking an item switches the selected project.
 */
export function ProjectSelector() {
  const projects = useProjects();
  const selectedProjectId = useSelectedProject();
  const selectProject = useFeatureFlagsStore((state) => state.selectProject);

  const handleValueChange = (value: string | null) => {
    if (value) {
      selectProject(value);
    }
  };

  return (
    <Select value={selectedProjectId} onValueChange={handleValueChange}>
      <SelectTrigger className="bg-sidebar text-sidebar-foreground">
        <SelectValue placeholder="Select a project" />
      </SelectTrigger>
      <SelectContent>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
