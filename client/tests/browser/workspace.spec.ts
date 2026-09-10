import { test, expect, type Page } from "@playwright/test";
async function demo(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Overview.", exact: true }),
  ).toBeVisible();
}
async function navigate(page: Page, name: string) {
  const link = page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name, exact: true });
  const href = await link.getAttribute("href");
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  const headings: Record<string, string> = {
    Overview: "Overview.",
    "New purchase": "Create Purchase",
    "New sale": "Create Sale",
    "Stock movements": "Stock Movements",
    "Purchase history": "Purchases History",
    "Sales history": "Sales History",
  };
  await expect(
    page.getByRole("heading", { name: headings[name] || name, exact: true }),
  ).toBeVisible();
}

test("demo CRUD, purchasing, sales, history and persistence never call the live API", async ({
  page,
}) => {
  const apiCalls: string[] = [];
  await page.route("**/api/**", (route) => {
    apiCalls.push(route.request().url());
    return route.abort();
  });
  await demo(page);
  await navigate(page, "Categories");
  await page
    .getByLabel("Category Name", { exact: true })
    .fill("Browser test supplies");
  await page
    .getByRole("button", { name: "Create Category", exact: true })
    .click();
  const categoryRow = page
    .getByRole("row")
    .filter({ hasText: "Browser test supplies" });
  await expect(categoryRow).toBeVisible();
  await categoryRow.getByRole("button", { name: "Edit", exact: true }).click();
  await page
    .getByLabel("Category Name", { exact: true })
    .last()
    .fill("Updated test supplies");
  await page
    .getByRole("button", { name: "Update Category", exact: true })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "Updated test supplies" }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("row")
    .filter({ hasText: "Updated test supplies" })
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "Updated test supplies" }),
  ).toHaveCount(0);
  await navigate(page, "New purchase");
  await page.getByLabel("Supplier", { exact: true }).selectOption("1");
  await page.getByLabel("Product", { exact: true }).selectOption("1");
  await page.getByLabel("Quantity", { exact: true }).fill("10");
  await page.getByLabel("Unit Cost", { exact: true }).fill("12");
  await page
    .getByRole("button", { name: "Create Purchase", exact: true })
    .click();
  await expect(
    page.getByText("Purchase created successfully", { exact: true }),
  ).toBeVisible();
  await navigate(page, "New sale");
  await page.getByLabel("Product", { exact: true }).selectOption("1");
  await page.getByLabel("Quantity", { exact: true }).fill("3");
  await page.getByLabel("Unit Price", { exact: true }).fill("20");
  await page.getByRole("button", { name: "Create Sale", exact: true }).click();
  await expect(
    page.getByText("Sale created successfully", { exact: true }),
  ).toBeVisible();
  await navigate(page, "Purchase history");
  await expect(page.locator("tbody tr").first()).toContainText("120.00");
  await page
    .getByRole("button", { name: "View Items", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Hide Items", exact: true }),
  ).toBeVisible();
  await navigate(page, "Sales history");
  await expect(page.locator("tbody tr").first()).toContainText("60.00");
  await navigate(page, "Products");
  await page.getByPlaceholder("Search by name or SKU").fill("GSC-0001");
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Nitrile");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("gades-demo-v1")!).products[0]
          .currentStock,
    ),
  ).toBe(7);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await download).suggestedFilename()).toBe("products_export.csv");
  await navigate(page, "Stock movements");
  await expect(page.locator("tbody tr").first()).toContainText("3");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Stock Movements", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("gades-demo-v1")!).products[0]
          .currentStock,
    ),
  ).toBe(7);
  expect(apiCalls).toEqual([]);
});

test("navigation keeps the document, search deep links filter products, charts and alerts work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.text().includes("width(-1)"))
      errors.push(message.text());
  });
  await demo(page);
  await page.evaluate(() => {
    (window as unknown as Record<string, unknown>).__navigationMarker =
      "same-document";
  });
  await expect(page.locator(".revenue-chart svg").first()).toBeVisible();
  await page.screenshot({
    path: "test-results/desktop-overview.png",
    fullPage: true,
  });
  const timings: number[] = [];
  for (const [link, heading] of [
    ["Categories", "Categories"],
    ["New purchase", "Create Purchase"],
    ["Suppliers", "Suppliers"],
    ["Overview", "Overview."],
  ]) {
    const start = Date.now();
    await navigate(page, link);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
    timings.push(Date.now() - start);
  }
  expect(
    await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__navigationMarker,
    ),
  ).toBe("same-document");
  await page.getByLabel("Chart period").selectOption("7");
  await expect(page.getByLabel("Chart period")).toHaveValue("7");
  await page.getByLabel("Chart product").selectOption("1");
  await expect(page.getByLabel("Chart product")).toHaveValue("1");
  await page.getByRole("button", { name: "Stock alerts: 4 products" }).click();
  await expect(
    page.getByRole("heading", { name: "Stock alerts" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+k");
  await page.getByLabel("Search pages and products").fill("GSC-0005");
  await page.getByRole("button", { name: /Copper wire/ }).click();
  await expect(page.getByPlaceholder("Search by name or SKU")).toHaveValue(
    "GSC-0005",
  );
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.keyboard.press("Control+k");
  await page.getByLabel("Search pages and products").fill("GSC-0009");
  await page.getByRole("button", { name: /Adjustable wrench/ }).click();
  await expect(page.getByPlaceholder("Search by name or SKU")).toHaveValue(
    "GSC-0009",
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Products", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  console.log("Production navigation ms:", JSON.stringify(timings));
});

test("mobile drawer and reduced-motion preference keep the workspace usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await demo(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await navigate(page, "Categories");
  await expect(
    page.getByRole("heading", { name: "Categories", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toHaveAttribute("aria-expanded", "false");
  expect(
    await page.evaluate(
      () =>
        getComputedStyle(document.querySelector(".page-enter")!).animationName,
    ),
  ).toBe("none");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await navigate(page, "Overview");
  await expect(
    page.getByRole("heading", { name: "Overview.", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/mobile-overview.png",
    fullPage: true,
  });
});

test("direct demo entry opens the populated dashboard without credentials or live API calls", async ({
  page,
}) => {
  const calls: string[] = [];
  await page.route("**/api/**", (route) => {
    calls.push(route.request().url());
    return route.abort();
  });
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { name: "Overview.", exact: true }),
  ).toBeVisible();
  const counts = await page.evaluate(() => {
    const store = JSON.parse(localStorage.getItem("gades-demo-v1")!);
    return {
      products: store.products.length,
      purchases: store.purchases.length,
      sales: store.sales.length,
      movements: store.movements.length,
    };
  });
  expect(counts).toEqual({
    products: 48,
    purchases: 148,
    sales: 214,
    movements: 632,
  });
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { name: "Overview.", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("gades-demo-v1")!).products.length,
    ),
  ).toBe(48);
  expect(calls).toEqual([]);
});
