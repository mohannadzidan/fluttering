import type { Page } from "@playwright/test";

/**
 * Sign up helper: navigates to /login, fills sign-up form, submits, waits for redirect to /dashboard
 */
export async function signUp(
  page: Page,
  name: string,
  email: string,
  password: string
): Promise<void> {
  // Navigate to login page (shows sign-up by default)
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  // Fill in sign-up form fields
  await page.getByTestId("sign-up-name-input").fill(name);
  await page.getByTestId("sign-up-email-input").fill(email);
  await page.getByTestId("sign-up-password-input").fill(password);

  // Submit form
  await page.getByTestId("sign-up-submit-button").click();

  // Wait for redirect to dashboard
  await page.waitForURL("**/dashboard");
  await page.waitForLoadState("networkidle");
}

/**
 * Sign in helper: navigates to /login, toggles to sign-in, fills form, submits, waits for redirect to /dashboard
 */
export async function signIn(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Navigate to login page
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  // Toggle to sign-in form
  await page.getByTestId("sign-in-toggle-button").click();

  // Fill in sign-in form fields
  await page.getByTestId("sign-in-email-input").fill(email);
  await page.getByTestId("sign-in-password-input").fill(password);

  // Submit form
  await page.getByTestId("sign-in-submit-button").click();

  // Wait for redirect to dashboard
  await page.waitForURL("**/dashboard");
  await page.waitForLoadState("networkidle");
}

/**
 * Sign out helper: clicks user menu trigger, then sign-out button, waits for redirect
 */
export async function signOut(page: Page): Promise<void> {
  // Click user menu trigger button
  await page.getByTestId("user-menu-trigger").click();

  // Click sign-out menu item
  await page.getByTestId("sign-out-button").click();

  // Wait for navigation (will redirect to /login due to protected route)
  await page.waitForURL("**/login");
  await page.waitForLoadState("networkidle");
}
