import { test, expect } from "../fixtures/cleanup.fixture";
import { submitCreateAndTrack } from "../support/create-program";

const BASE_URL = process.env.DIDAXIS_URL ?? "https://test.didaxis.studio";

test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.getByRole("textbox", { name: "Email" }).fill(process.env.DIDAXIS_EMAIL!);
  await page.getByRole("textbox", { name: "Password" }).fill(process.env.DIDAXIS_PASSWORD!);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL((url) => !url.pathname.includes("login"), {
    timeout: 30_000,
  });
  await page.goto(`${BASE_URL}/programs`);
  await page.waitForLoadState("networkidle");
});

function openCreateModal(page: import("@playwright/test").Page) {
  return test.step("Open Create Program modal", async () => {
    await page.getByRole("button", { name: "+ New Program" }).click();
    const modal = page.getByRole("dialog", { name: "New Program" });
    await expect(modal).toBeVisible();
    return modal;
  });
}

// --- Positive flows ---

test("TC-001 — Program is created when name contains allowed special characters", async ({
  page,
}) => {
  const name = `Informatique & IA - Niveau ${Date.now()}`;
  const desc = "Evening track for working professionals.";

  const modal = await openCreateModal(page);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
  await modal.getByRole("textbox", { name: "Description" }).fill(desc);
  await submitCreateAndTrack(page, modal);

  await expect(modal).not.toBeVisible();
  await expect(page.getByText(name)).toBeVisible();
});

test("TC-002 — Program is created when Program Name length is exactly 100 characters", async ({
  page,
}) => {
  const prefix = `Len100-${Date.now()}-`;
  const name100 = prefix + "X".repeat(100 - prefix.length);

  const modal = await openCreateModal(page);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name100);
  await submitCreateAndTrack(page, modal);

  await expect(modal).not.toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: name100 })).toBeVisible();
});

test("TC-003 — Program is created when Description length is exactly 500 characters", async ({
  page,
}) => {
  const name = `Desc500 ${Date.now()}`;
  const desc500 = "D".repeat(500);

  const modal = await openCreateModal(page);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
  await modal.getByRole("textbox", { name: "Description" }).fill(desc500);
  await submitCreateAndTrack(page, modal);

  await expect(modal).not.toBeVisible();
  await expect(page.getByText(name)).toBeVisible();
});

// --- Negative flows ---

test("TC-004 — Whitespace-only Program Name blocks submission", async ({
  page,
}) => {
  const modal = await openCreateModal(page);
  await modal.getByRole("textbox", { name: "Program Name" }).fill("   ");

  await expect(modal.getByRole("button", { name: "Create" })).toBeDisabled();
});

// BUG: app allows duplicate names — no server-side uniqueness check
test.fail("TC-005 — Duplicate Program Name is rejected with a server error", async ({
  page,
}) => {
  const name = `Dup Check ${Date.now()}`;
  const modal = await openCreateModal(page);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
  await submitCreateAndTrack(page, modal);
  await expect(modal).not.toBeVisible();

  const modal2 = await openCreateModal(page);
  await modal2.getByRole("textbox", { name: "Program Name" }).fill(name);
  await modal2.getByRole("textbox", { name: "Description" }).fill("Duplicate attempt");
  await submitCreateAndTrack(page, modal2);

  await expect(modal2).toBeVisible();
  await expect(modal2.getByText(/already exists|duplicate/i)).toBeVisible();
});

test("TC-006 — Program Name exceeding 100 characters is rejected", async ({
  page,
}) => {
  const prefix = `Over100-${Date.now()}-`;
  const name101 = prefix + "X".repeat(101 - prefix.length);

  const modal = await openCreateModal(page);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name101);

  const createBtn = modal.getByRole("button", { name: "Create" });
  if (await createBtn.isEnabled()) {
    await createBtn.click();
    await expect(modal).toBeVisible();
  } else {
    await expect(createBtn).toBeDisabled();
  }
});

test("TC-007 — Description exceeding 500 characters is rejected", async ({
  page,
}) => {
  const name = `Desc501 ${Date.now()}`;
  const desc501 = "D".repeat(501);

  const modal = await openCreateModal(page);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
  await modal.getByRole("textbox", { name: "Description" }).fill(desc501);

  const createBtn = modal.getByRole("button", { name: "Create" });
  if (await createBtn.isEnabled()) {
    await createBtn.click();
    await expect(modal).toBeVisible();
  } else {
    await expect(createBtn).toBeDisabled();
  }
});

// BUG: depends on duplicate rejection which the app does not enforce
test.fail("TC-008 — Program must not appear in list when server rejects creation", async ({
  page,
}) => {
  const name = `Dup Phantom ${Date.now()}`;
  const modal = await openCreateModal(page);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
  await submitCreateAndTrack(page, modal);
  await expect(modal).not.toBeVisible();

  const modal2 = await openCreateModal(page);
  await modal2.getByRole("textbox", { name: "Program Name" }).fill(name);
  await modal2.getByRole("textbox", { name: "Description" }).fill("Should fail");
  await submitCreateAndTrack(page, modal2);
  await page.waitForLoadState("networkidle");

  const rows = page.getByRole("row").filter({ hasText: name });
  await expect(rows).toHaveCount(1);
});

// --- Edge cases ---

// BUG: depends on duplicate rejection which the app does not enforce
test.fail("TC-009 — Leading/trailing spaces are trimmed and still enforce duplicate prevention", async ({
  page,
}) => {
  const name = `Trim Dup ${Date.now()}`;
  const modal = await openCreateModal(page);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
  await submitCreateAndTrack(page, modal);
  await expect(modal).not.toBeVisible();

  const modal2 = await openCreateModal(page);
  await modal2.getByRole("textbox", { name: "Program Name" }).fill(`  ${name}  `);
  await submitCreateAndTrack(page, modal2);

  await expect(modal2).toBeVisible();
  await expect(modal2.getByText(/already exists|duplicate/i)).toBeVisible();
});

test("TC-010 — Program Name supports accented characters without corruption", async ({
  page,
}) => {
  const name = `Économie Avancée ${Date.now()}`;

  const modal = await openCreateModal(page);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
  await submitCreateAndTrack(page, modal);

  await expect(modal).not.toBeVisible();
  await expect(page.getByText(name)).toBeVisible();
});

test("TC-011 — Program Name containing quotes/brackets is displayed safely", async ({
  page,
}) => {
  const name = `AI "Foundations" (Level ${Date.now()})`;

  const modal = await openCreateModal(page);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
  await submitCreateAndTrack(page, modal);

  await expect(modal).not.toBeVisible();
  await expect(page.getByText(name)).toBeVisible();
});
