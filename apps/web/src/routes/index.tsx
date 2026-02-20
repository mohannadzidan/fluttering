import { createFileRoute } from "@tanstack/react-router";
import { FlagsLayout } from "@/features/feature-flags";
import { protectRoute } from "@/features/auth";

export const Route = createFileRoute("/")({
  beforeLoad: protectRoute,
  component: HomeComponent,
});

function HomeComponent() {
  return <FlagsLayout />;
}
