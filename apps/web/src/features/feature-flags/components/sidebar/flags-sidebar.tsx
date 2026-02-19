import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ProjectSelector } from "./project-selector";

/**
 * Collapsible sidebar for the feature flags app.
 * Displays the Fluttering logo, project selector, and collapse trigger.
 */
export function FlagsSidebar() {
  return (
    <Sidebar>
      {/* Header with logo and collapse trigger */}
      <SidebarHeader className="flex flex-row items-center justify-between">
        <h1 className="text-xl font-bold text-radiate">fluttering</h1>
        <SidebarTrigger />
      </SidebarHeader>

      {/* Content: Project selector and divider */}
      <SidebarContent>
        <ProjectSelector />
        <SidebarSeparator />
      </SidebarContent>
    </Sidebar>
  );
}
