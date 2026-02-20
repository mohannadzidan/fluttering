/**
 * Auth Feature Module — Public API
 *
 * This file is the sole public surface of the auth feature.
 * External modules (e.g., routes, components) import only from this file.
 */

export { AuthRoot } from "./components/auth-root";
export { default as UserMenu } from "./components/user-menu";
export { protectRoute, redirectIfAuthenticated } from "./utils/route-guards";
export { authClient } from "./utils/auth-client";
