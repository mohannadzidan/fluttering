import { createFileRoute } from "@tanstack/react-router";
import { FlagsLayout } from "@/features/feature-flags";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return <FlagsLayout />;
}
