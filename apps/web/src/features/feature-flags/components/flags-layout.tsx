import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { FlagList } from "./flag-list/flag-list";
import { FlagsSidebar } from "./sidebar/flags-sidebar";

/**
 * Root layout component for the feature flags UI.
 * Composes the collapsible sidebar with project selection and main content panel with the flag list.
 */
export function FlagsLayout() {
  return (
    <SidebarProvider>
      <FlagsSidebar />

      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <main className="flex-1">
          <FlagList />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
