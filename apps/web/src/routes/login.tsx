import { createFileRoute } from "@tanstack/react-router";

import { AuthRoot, redirectIfAuthenticated } from "@/features/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: redirectIfAuthenticated,
  component: RouteComponent,
});

function RouteComponent() {
  return <AuthRoot />;
}
