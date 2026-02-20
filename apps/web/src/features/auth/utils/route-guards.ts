import { redirect } from "@tanstack/react-router";
import { authClient } from "./auth-client";

/**
 * Route guard: Protects routes by requiring authentication.
 * If no active session, redirects to /login.
 * Returns session data for use in route context.
 */
export async function protectRoute() {
  const session = await authClient.getSession();
  if (!session.data) {
    redirect({
      to: "/login",
      throw: true,
    });
  }
  return { session };
}

/**
 * Route guard: Redirects authenticated users away from auth routes.
 * If session exists, redirects to /.
 * Used on /login to prevent authenticated users from seeing sign-in/sign-up.
 */
export async function redirectIfAuthenticated() {
  const session = await authClient.getSession();
  if (session.data) {
    redirect({
      to: "/",
      throw: true,
    });
  }
}
