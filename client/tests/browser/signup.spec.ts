import { test, expect } from "@playwright/test";

test("signup link, client validation, duplicate feedback, and successful registration", async ({
  page,
}) => {
  const requests: Record<string, unknown>[] = [];
  await page.route("**/api/auth/register", async (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    if (body.email === "existing@example.com")
      await route.fulfill({
        status: 409,
        json: {
          message: "An account with this email already exists. Please sign in.",
        },
      });
    else
      await route.fulfill({
        status: 201,
        json: {
          message: "Account created successfully. Please sign in.",
          user: { id: 99, name: body.name, email: body.email, role: "member" },
        },
      });
  });
  await page.goto("/login");
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(
    page.getByRole("heading", { name: "Create your account." }),
  ).toBeVisible();
  await page.getByLabel("Full name", { exact: true }).fill("Test Person");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("existing@example.com");
  await page.getByLabel("Password", { exact: true }).fill("long-password-123");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("different-password");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "do not match",
  );
  expect(requests).toHaveLength(0);
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("long-password-123");
  await page.getByRole("button", { name: "Show passwords" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Hide passwords" }).click();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "already exists",
  );
  await page
    .getByLabel("Email address", { exact: true })
    .fill("new@example.com");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Account created." }),
  ).toBeVisible();
  expect(requests.at(-1)).toEqual({
    name: "Test Person",
    email: "new@example.com",
    password: "long-password-123",
  });
  await page.getByRole("link", { name: "Go to sign in" }).click();
  await expect(
    page.getByRole("button", { name: "Sign in to workspace" }),
  ).toBeVisible();
});
test("sign-up remains public on mobile and reports API failure without losing the form", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({
      status: 500,
      json: { message: "Could not create your account. Please try again." },
    }),
  );
  await page.goto("/signup");
  await page.getByLabel("Full name", { exact: true }).fill("Mobile User");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("mobile@example.com");
  await page.getByLabel("Password", { exact: true }).fill("long-password-123");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("long-password-123");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Please try again",
  );
  await expect(page.getByLabel("Full name")).toHaveValue("Mobile User");
  await expect(
    page.getByRole("button", { name: "Create account", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/signup-mobile.png",
    fullPage: true,
  });
});
test("registration from a demo session still calls the live authentication endpoint", async ({
  page,
}) => {
  let called = false;
  await page.route("**/api/auth/register", (route) => {
    called = true;
    return route.fulfill({
      status: 201,
      json: {
        user: {
          id: 101,
          name: "Demo Visitor",
          email: "visitor@example.com",
          role: "member",
        },
      },
    });
  });
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { name: "Overview.", exact: true }),
  ).toBeVisible();
  await page.goto("/signup");
  await page.getByLabel("Full name", { exact: true }).fill("Demo Visitor");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("visitor@example.com");
  await page.getByLabel("Password", { exact: true }).fill("long-password-123");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("long-password-123");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Account created." }),
  ).toBeVisible();
  expect(called).toBe(true);
});
