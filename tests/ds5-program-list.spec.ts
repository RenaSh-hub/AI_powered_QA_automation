import { test, expect, type Page } from "../fixtures/cleanup.fixture";
import { createProgram } from "../support/create-program";

const BASE_URL = process.env.DIDAXIS_URL ?? "https://test.didaxis.studio";

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByRole("textbox", { name: "Email" }).fill(process.env.DIDAXIS_EMAIL!);
  await page.getByRole("textbox", { name: "Password" }).fill(process.env.DIDAXIS_PASSWORD!);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL((url) => !url.pathname.includes("login"), {
    timeout: 30_000,
  });
}

async function deleteProgram(page: Page, name: string) {
  const row = page.getByRole("row").filter({ hasText: name });
  page.once("dialog", (d) => d.accept());
  await row.getByRole("button", { name: "🗑" }).click();
  await expect(row).not.toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.goto(`${BASE_URL}/programs`);
  await page.waitForLoadState("networkidle");
});

// --- Positive flows ---

test("TC-001 — Programs page shows a list with each program's name and description preview", async ({
  page,
}) => {
  const ts = Date.now();
  const name1 = `Web Development ${ts}`;
  const desc1 = "Full-stack cohort for 2026";
  const name2 = `Data Science ${ts}`;
  const desc2 = "Python, stats, and ML fundamentals";

  await createProgram(page, name1, desc1);
  await createProgram(page, name2, desc2);

  const row1 = page.getByRole("row").filter({ hasText: name1 });
  const row2 = page.getByRole("row").filter({ hasText: name2 });

  await expect(row1).toBeVisible();
  await expect(row1.getByText(desc1)).toBeVisible();
  await expect(row2).toBeVisible();
  await expect(row2.getByText(desc2)).toBeVisible();
});

test("TC-002 — Programs page header and '+ New Program' button are visible for Admin", async ({
  page,
}) => {
  await expect(page.getByRole("heading", { name: "Programs" })).toBeVisible();
  await expect(page.getByRole("button", { name: "+ New Program" })).toBeVisible();
});

test("TC-004 — Clicking a program row opens the Semester Panel with semester-related content", async ({
  page,
}) => {
  const name = `Semester Panel ${Date.now()}`;
  await createProgram(page, name, "Panel test");

  const row = page.getByRole("row").filter({ hasText: name });
  await row.click();

  await expect(page.getByText(/semester|holiday|break/i)).toBeVisible();
});

test("TC-005 — 'Manage Courses' navigates to Course Builder from the Semester Panel", async ({
  page,
}) => {
  const name = `Manage Courses ${Date.now()}`;
  await createProgram(page, name, "Navigate to Course Builder");

  const row = page.getByRole("row").filter({ hasText: name });
  await row.click();

  await page.getByRole("button", { name: /Manage Courses/i }).click();
  await page.waitForURL((url) => !url.pathname.endsWith("/programs"), {
    timeout: 10_000,
  });
  expect(page.url()).not.toContain("/programs");
});

test("TC-006 — Program list reflects a successful create without manual refresh", async ({
  page,
}) => {
  const name = `Cloud Engineering ${Date.now()}`;
  const desc = "AWS + containers + CI/CD";

  await createProgram(page, name, desc);

  await expect(page.getByRole("row").filter({ hasText: name })).toBeVisible();
});

test("TC-007 — Program list reflects a successful edit without manual refresh", async ({
  page,
}) => {
  const name = `Edit Refresh ${Date.now()}`;
  await createProgram(page, name, "Before edit");

  const row = page.getByRole("row").filter({ hasText: name });
  await row.getByRole("button", { name: "✏️" }).click();

  const modal = page.getByRole("dialog", { name: "Edit Program" });
  const updatedName = `${name} - Updated`;
  await modal.getByRole("textbox", { name: "Program Name" }).fill(updatedName);
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();

  await expect(page.getByRole("row").filter({ hasText: updatedName })).toBeVisible();
});

test("TC-008 — Program list reflects a successful delete without manual refresh", async ({
  page,
}) => {
  const name = `Del Refresh ${Date.now()}`;
  await createProgram(page, name, "Delete refresh test");

  const row = page.getByRole("row").filter({ hasText: name });
  page.once("dialog", (d) => d.accept());
  await row.getByRole("button", { name: "🗑" }).click();

  await expect(row).not.toBeVisible();
});

test("TC-020 — Program Name filter returns only programs whose names match the query", async ({
  page,
}) => {
  const ts = Date.now();
  const web1 = `Web Development ${ts}`;
  const web2 = `Web Development B ${ts}`;
  const data = `Data Science ${ts}`;

  await createProgram(page, web1, "Web desc");
  await createProgram(page, web2, "Web desc B");
  await createProgram(page, data, "Data desc");

  await page.getByRole("textbox", { name: /program name/i }).fill("Web Development");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("row").filter({ hasText: web1 })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: web2 })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: data })).not.toBeVisible();
});

test("TC-021 — Program Name filter supports partial matching (substring)", async ({
  page,
}) => {
  const name = `Informatique & IA - Niveau ${Date.now()}`;
  await createProgram(page, name, "Partial match test");

  await page.getByRole("textbox", { name: /program name/i }).fill("Niveau");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("row").filter({ hasText: name })).toBeVisible();
});

test("TC-024 — Clearing filters restores the full unfiltered program list", async ({
  page,
}) => {
  const ts = Date.now();
  const nameA = `Filter Clear A ${ts}`;
  const nameB = `Filter Clear B ${ts}`;
  await createProgram(page, nameA, "A desc");
  await createProgram(page, nameB, "B desc");

  const filterInput = page.getByRole("textbox", { name: /program name/i });
  await filterInput.fill("Filter Clear A");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("row").filter({ hasText: nameB })).not.toBeVisible();

  await filterInput.fill("");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("row").filter({ hasText: nameA })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: nameB })).toBeVisible();
});

// --- Negative flows ---

test("TC-012 — Clicking a program row must not navigate away unexpectedly", async ({
  page,
}) => {
  const name = `No Navigate ${Date.now()}`;
  await createProgram(page, name, "Stay on page test");

  const row = page.getByRole("row").filter({ hasText: name });
  await row.click();

  expect(page.url()).toContain("/programs");
});

test("TC-013 — Manage Courses is not available if no program is selected", async ({
  page,
}) => {
  const manageCourses = page.getByRole("button", { name: /Manage Courses/i });
  const count = await manageCourses.count();

  if (count > 0) {
    await expect(manageCourses).toBeDisabled();
  } else {
    expect(count).toBe(0);
  }
});

test("TC-025 — No results state is shown when filters match zero programs", async ({
  page,
}) => {
  const filterInput = page.getByRole("textbox", { name: /program name/i });
  await filterInput.fill(`Nonexistent Program ${Date.now()}`);
  await page.waitForLoadState("networkidle");

  const rows = page.getByRole("row").filter({ hasNotText: /program name/i });
  await expect(rows).toHaveCount(0);
});

// --- Edge cases ---

test("TC-014 — Empty state renders correct icon, message, and 'Create Program' button when no programs exist", async ({
  page,
}) => {
  test.skip(true, "Requires a system with 0 programs — environment-specific setup needed");

  await expect(page.getByText("No programs yet. Create your first program to get started.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create Program" })).toBeVisible();
});

test("TC-016 — Description preview handles very long descriptions without breaking layout", async ({
  page,
}) => {
  const name = `Long Desc ${Date.now()}`;
  const longDesc = "L".repeat(500);
  await createProgram(page, name, longDesc);

  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row).toBeVisible();

  const rowBox = await row.boundingBox();
  expect(rowBox).not.toBeNull();
  expect(rowBox!.height).toBeLessThan(200);
});

test("TC-017 — Program Name with special characters displays correctly in the list", async ({
  page,
}) => {
  const name = `Informatique & IA - Niveau ${Date.now()}`;
  await createProgram(page, name, "Special char display test");

  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row).toBeVisible();
});

test("TC-018 — Switching selection updates Semester Panel to the newly selected program", async ({
  page,
}) => {
  const ts = Date.now();
  const name1 = `Panel Switch A ${ts}`;
  const name2 = `Panel Switch B ${ts}`;
  await createProgram(page, name1, "First program");
  await createProgram(page, name2, "Second program");

  await page.getByRole("row").filter({ hasText: name1 }).click();
  const panelContent1 = await page.locator('[class*="panel"], [class*="sidebar"], [role="complementary"]').textContent();

  await page.getByRole("row").filter({ hasText: name2 }).click();
  const panelContent2 = await page.locator('[class*="panel"], [class*="sidebar"], [role="complementary"]').textContent();

  expect(panelContent2).not.toBe(panelContent1);
});

test("TC-019 — Row click still works after list re-fetch following a mutation", async ({
  page,
}) => {
  const ts = Date.now();
  const nameA = `Post Mutation A ${ts}`;
  const nameB = `Post Mutation B ${ts}`;
  await createProgram(page, nameA, "Mutation click test A");
  await createProgram(page, nameB, "Mutation click test B");

  await deleteProgram(page, nameA);

  const rowB = page.getByRole("row").filter({ hasText: nameB });
  await rowB.click();

  await expect(page.getByText(/semester|holiday|break/i)).toBeVisible();
});

test("TC-027 — Program Name filter trims leading/trailing spaces in the query", async ({
  page,
}) => {
  const name = `Trim Filter ${Date.now()}`;
  await createProgram(page, name, "Trim test");

  const filterInput = page.getByRole("textbox", { name: /program name/i });
  await filterInput.fill(`  ${name}  `);
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("row").filter({ hasText: name })).toBeVisible();
});

test("TC-028 — Program Name filter handles special characters safely", async ({
  page,
}) => {
  const name = `Informatique & IA - Niveau ${Date.now()}`;
  await createProgram(page, name, "Filter special chars");

  const filterInput = page.getByRole("textbox", { name: /program name/i });
  await filterInput.fill("& IA -");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("row").filter({ hasText: name })).toBeVisible();
});

test("TC-029 — After create/delete, list re-fetch preserves active filters and updates results accordingly", async ({
  page,
}) => {
  const ts = Date.now();
  const web1 = `Web Alpha ${ts}`;
  const web2 = `Web Security ${ts}`;
  await createProgram(page, web1, "First web program");

  const filterInput = page.getByRole("textbox", { name: /program name/i });
  await filterInput.fill("Web");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("row").filter({ hasText: web1 })).toBeVisible();

  await createProgram(page, web2, "New web program");
  await expect(page.getByRole("row").filter({ hasText: web2 })).toBeVisible();

  await deleteProgram(page, web1);
  await expect(page.getByRole("row").filter({ hasText: web1 })).not.toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: web2 })).toBeVisible();
});
