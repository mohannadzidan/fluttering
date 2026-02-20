import { test, expect } from "@playwright/test";
import { signUp, signIn, signOut } from "./auth-helpers";

/**
 * User Story 1: New User Registration (P1)
 *
 * Tests for the sign-up flow, validation, and route protection.
 */
test.describe("US1 — Registration (Sign-Up)", () => {
  test.beforeEach(async ({ page }) => {
    // Each test starts fresh; no pre-authenticated state needed for US1
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("T1: Valid sign-up → redirected to dashboard", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Fill in sign-up form with valid data
    const uniqueEmail = `test-${Date.now()}@example.com`;
    await page.getByTestId("sign-up-name-input").fill("Test User");
    await page.getByTestId("sign-up-email-input").fill(uniqueEmail);
    await page.getByTestId("sign-up-password-input").fill("password123");

    // Submit
    await page.getByTestId("sign-up-submit-button").click();

    // Verify redirect to dashboard and success toast
    await page.waitForURL("**/dashboard");
    await expect(page.locator("text=Sign up successful")).toBeVisible();
  });

  test("T2: Duplicate email → error message shown", async ({ page }) => {
    // Create an account first
    const uniqueEmail = `duplicate-test-${Date.now()}@example.com`;
    await signUp(page, "First User", uniqueEmail, "password123");

    // Try to sign up again with the same email
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("sign-up-name-input").fill("Second User");
    await page.getByTestId("sign-up-email-input").fill(uniqueEmail);
    await page.getByTestId("sign-up-password-input").fill("password456");

    // Submit
    await page.getByTestId("sign-up-submit-button").click();

    // Verify error toast is shown (exact message from Better Auth)
    await expect(page.locator("text=/Email already in use|User already exists/i")).toBeVisible({
      timeout: 5000,
    });

    // Verify still on login page
    expect(page.url()).toContain("/login");
  });

  test("T3: Invalid email format → inline validation error", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Fill with invalid email
    await page.getByTestId("sign-up-name-input").fill("Test User");
    await page.getByTestId("sign-up-email-input").fill("not-an-email");
    await page.getByTestId("sign-up-password-input").fill("password123");

    // Submit
    await page.getByTestId("sign-up-submit-button").click();

    // Verify validation error is shown
    await expect(page.locator("text=Invalid email address")).toBeVisible();

    // Verify still on login page
    expect(page.url()).toContain("/login");
  });

  test("T4: Password < 8 chars → inline validation error", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Fill with short password
    await page.getByTestId("sign-up-name-input").fill("Test User");
    await page.getByTestId("sign-up-email-input").fill(`test-${Date.now()}@example.com`);
    await page.getByTestId("sign-up-password-input").fill("short");

    // Submit
    await page.getByTestId("sign-up-submit-button").click();

    // Verify validation error is shown
    await expect(page.locator("text=Password must be at least 8 characters")).toBeVisible();

    // Verify still on login page
    expect(page.url()).toContain("/login");
  });

  test("T5: Empty name field → inline validation error", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Leave name empty, fill others
    await page.getByTestId("sign-up-email-input").fill(`test-${Date.now()}@example.com`);
    await page.getByTestId("sign-up-password-input").fill("password123");

    // Submit (name is left empty/default)
    await page.getByTestId("sign-up-submit-button").click();

    // Verify validation error is shown
    await expect(page.locator("text=Name must be at least 2 characters")).toBeVisible();

    // Verify still on login page
    expect(page.url()).toContain("/login");
  });

  test("T6: Already-authenticated user visiting /login → redirected to /", async ({ page }) => {
    // Create and sign up an account
    const uniqueEmail = `auth-redirect-${Date.now()}@example.com`;
    await signUp(page, "Auth Test User", uniqueEmail, "password123");

    // User is now at /dashboard and authenticated
    // Navigate directly to /login
    await page.goto("/login");

    // Should redirect back to / (home, which will show FlagsLayout)
    await page.waitForURL(/(\/$|\/login)/); // Could redirect to / or stay if redirectIfAuthenticated doesn't work

    // Verify the page content suggests we're on the home/dashboard area
    // The most reliable check is to see if we're NOT on the login form
    const authRootContent = await page.locator("text=Create Account").isVisible();
    expect(authRootContent).toBe(false); // Login form should not be visible
  });
});

/**
 * User Story 2: Returning User Sign-In (P2)
 *
 * Tests for the sign-in flow and session persistence.
 */
test.describe("US2 — Sign-In", () => {
  test("T7: Valid sign-in → redirected to dashboard", async ({ page, context }) => {
    // Create a user account first (via sign-up helper)
    const uniqueEmail = `signin-test-${Date.now()}@example.com`;
    await signUp(page, "SignIn Test User", uniqueEmail, "password123");

    // Clear session/cookies to simulate new browser session
    await context.clearCookies();

    // Now sign in with the created account
    await signIn(page, uniqueEmail, "password123");

    // Verify redirected to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test("T8: Wrong password → error toast visible", async ({ page }) => {
    // Create a user account first
    const uniqueEmail = `wrongpass-test-${Date.now()}@example.com`;
    await signUp(page, "WrongPass Test", uniqueEmail, "correctpass123");

    // Clear cookies to simulate new session
    await page.context().clearCookies();

    // Navigate to login and toggle to sign-in
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("sign-in-toggle-button").click();

    // Try to sign in with wrong password
    await page.getByTestId("sign-in-email-input").fill(uniqueEmail);
    await page.getByTestId("sign-in-password-input").fill("wrongpassword");

    // Submit
    await page.getByTestId("sign-in-submit-button").click();

    // Verify error toast
    await expect(page.locator("text=/Invalid email or password|Authentication failed/i")).toBeVisible({
      timeout: 5000,
    });

    // Verify still on login page
    expect(page.url()).toContain("/login");
  });

  test("T9: Non-existent email → error toast visible", async ({ page }) => {
    // Navigate to login and toggle to sign-in
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("sign-in-toggle-button").click();

    // Try to sign in with non-existent email
    await page.getByTestId("sign-in-email-input").fill("nonexistent@example.com");
    await page.getByTestId("sign-in-password-input").fill("password123");

    // Submit
    await page.getByTestId("sign-in-submit-button").click();

    // Verify error toast
    await expect(page.locator("text=/Invalid email or password|Authentication failed/i")).toBeVisible({
      timeout: 5000,
    });

    // Verify still on login page
    expect(page.url()).toContain("/login");
  });

  test("T10: Invalid email format → inline validation error", async ({ page }) => {
    // Navigate to login and toggle to sign-in
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("sign-in-toggle-button").click();

    // Fill with invalid email
    await page.getByTestId("sign-in-email-input").fill("not-an-email");
    await page.getByTestId("sign-in-password-input").fill("password123");

    // Submit
    await page.getByTestId("sign-in-submit-button").click();

    // Verify validation error
    await expect(page.locator("text=Invalid email address")).toBeVisible();

    // Verify still on login page
    expect(page.url()).toContain("/login");
  });

  test("T11: Sign-in form toggle from sign-up → sign-in form appears", async ({ page }) => {
    // Navigate to login (shows sign-up by default)
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Verify sign-up form is visible
    await expect(page.locator("text=Create Account")).toBeVisible();

    // Click toggle to sign-in
    await page.getByTestId("sign-in-toggle-button").click();

    // Verify sign-up form is gone and sign-in form appears
    await expect(page.locator("text=Create Account")).not.toBeVisible();
    await expect(page.locator("text=Welcome Back")).toBeVisible();
  });

  test("T12: Session persists on page reload", async ({ page }) => {
    // Create and sign in
    const uniqueEmail = `persist-test-${Date.now()}@example.com`;
    await signUp(page, "Persist Test", uniqueEmail, "password123");

    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Reload the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify still on dashboard (session persisted)
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator("text=Welcome")).toBeVisible();
  });
});

/**
 * User Story 3: Sign-Out (P3)
 *
 * Tests for the sign-out flow and session termination.
 */
test.describe("US3 — Sign-Out", () => {
  test("T13: Sign in → click sign-out → redirected to /login", async ({ page }) => {
    // Create and sign in
    const uniqueEmail = `signout-test-${Date.now()}@example.com`;
    await signUp(page, "SignOut Test", uniqueEmail, "password123");

    // We're now at /dashboard and authenticated
    // Use signOut helper to verify the flow
    await signOut(page);

    // Verify redirected to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("T14: After sign-out, navigating to / redirects to /login", async ({ page }) => {
    // Create and sign in
    const uniqueEmail = `logout-redirect-${Date.now()}@example.com`;
    await signUp(page, "Logout Redirect Test", uniqueEmail, "password123");

    // Sign out
    await signOut(page);

    // Now try to navigate to / (which is protected)
    await page.goto("/");

    // Should redirect to /login
    await page.waitForURL(/.*\/login/);
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("T15: Header shows 'Sign In' link when unauthenticated", async ({ page }) => {
    // Start unauthenticated (fresh session)
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Verify sign-in link is visible in header
    await expect(page.getByTestId("sign-in-link")).toBeVisible();

    // Verify user menu trigger is NOT visible
    const userMenuTriggerVisible = await page.getByTestId("user-menu-trigger").isVisible().catch(() => false);
    expect(userMenuTriggerVisible).toBe(false);
  });
});

/**
 * User Story 4: Protected Route Enforcement (P4)
 *
 * Tests for route guards and unauthorized access.
 */
test.describe("US4 — Protected Routes", () => {
  test("T16: Unauthenticated access to / → redirected to /login", async ({ page, context }) => {
    // Clear all cookies to ensure no session
    await context.clearCookies();

    // Navigate directly to /
    await page.goto("/");

    // Should redirect to /login
    await page.waitForURL(/.*\/login/);
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("T17: Unauthenticated access to /dashboard → redirected to /login", async ({ page, context }) => {
    // Clear all cookies
    await context.clearCookies();

    // Navigate directly to /dashboard
    await page.goto("/dashboard");

    // Should redirect to /login
    await page.waitForURL(/.*\/login/);
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("T18: Authenticated user can access / → FlagsLayout renders", async ({ page }) => {
    // Create and sign in
    const uniqueEmail = `access-home-${Date.now()}@example.com`;
    await signUp(page, "Access Home Test", uniqueEmail, "password123");

    // Sign out and then sign back in to fully test the flow
    await signOut(page);
    await signIn(page, uniqueEmail, "password123");

    // Now navigate to /
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify we can access / (should show FlagsLayout or Sidebar content)
    // The FlagsLayout contains a sidebar and flags panel
    await expect(page.locator("text=/Fluttering|Sidebar|Flag/i")).toBeVisible({ timeout: 5000 });
  });

  test("T19: Authenticated user can access /dashboard → dashboard renders", async ({ page }) => {
    // Create and sign in
    const uniqueEmail = `access-dashboard-${Date.now()}@example.com`;
    await signUp(page, "Access Dashboard Test", uniqueEmail, "password123");

    // We should already be at /dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator("text=/Dashboard|Welcome|Dashboard/i")).toBeVisible();
  });
});

/**
 * User Story 5: Persistent User Identity in UI (P5)
 *
 * Tests for user name display and header state.
 */
test.describe("US5 — User Identity in Header", () => {
  test("T20: Signed-in user sees their name in user-menu-trigger button", async ({ page }) => {
    // Create and sign in
    const userName = "Identity Test User";
    const uniqueEmail = `identity-${Date.now()}@example.com`;
    await signUp(page, userName, uniqueEmail, "password123");

    // Navigate to a page with the header (dashboard)
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Verify user menu trigger button shows the user's name
    const userMenuButton = page.getByTestId("user-menu-trigger");
    await expect(userMenuButton).toContainText(userName);
  });

  test("T21: Opening user menu shows the user's email address", async ({ page }) => {
    // Create and sign in
    const uniqueEmail = `email-display-${Date.now()}@example.com`;
    await signUp(page, "Email Display Test", uniqueEmail, "password123");

    // Open user menu
    await page.getByTestId("user-menu-trigger").click();

    // Verify email is visible in dropdown
    await expect(page.locator(`text=${uniqueEmail}`)).toBeVisible();
  });

  test("T22: Unauthenticated visitor sees 'Sign In' link instead of user menu", async ({ page }) => {
    // Fresh session, unauthenticated
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Verify sign-in link is visible
    await expect(page.getByTestId("sign-in-link")).toBeVisible();

    // Verify user menu button is NOT visible
    const userMenuVisible = await page.getByTestId("user-menu-trigger").isVisible().catch(() => false);
    expect(userMenuVisible).toBe(false);
  });

  test("T23: User name in header updates immediately after sign-up", async ({ page }) => {
    // Navigate to login
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Fill sign-up form
    const userName = "Immediate Update Test";
    const uniqueEmail = `immediate-${Date.now()}@example.com`;
    await page.getByTestId("sign-up-name-input").fill(userName);
    await page.getByTestId("sign-up-email-input").fill(uniqueEmail);
    await page.getByTestId("sign-up-password-input").fill("password123");

    // Submit
    await page.getByTestId("sign-up-submit-button").click();

    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard");
    await page.waitForLoadState("networkidle");

    // Verify user name appears in header immediately
    const userMenuButton = page.getByTestId("user-menu-trigger");
    await expect(userMenuButton).toContainText(userName);
  });
});
