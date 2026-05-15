import { test, expect, Page, Locator } from "@playwright/test";

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

async function createProgram(page: Page, name: string, description: string) {
  await page.getByRole("button", { name: "+ New Program" }).click();
  const modal = page.getByRole("dialog", { name: "New Program" });
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
  await modal.getByRole("textbox", { name: "Description" }).fill(description);
  await modal.getByRole("button", { name: "Create" }).click();
  await expect(modal).not.toBeVisible();
  await expect(page.getByText(name)).toBeVisible();
}

async function openEditModal(page: Page, programName: string) {
  const row = page.getByRole("row").filter({ hasText: programName });
  await row.getByRole("button", { name: "✏️" }).click();
  const modal = page.getByRole("dialog", { name: "Edit Program" });
  await expect(modal).toBeVisible();
  return modal;
}

/** Section may reopen expanded — only click Show when the section is collapsed. */
async function expandAiConfigIfCollapsed(modal: Locator) {
  const showBtn = modal.getByRole("button", { name: /Show AI Generation Config/ });
  if (await showBtn.isVisible()) {
    await showBtn.click();
  }
}

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.goto(`${BASE_URL}/programs`);
  await page.waitForLoadState("networkidle");
});

// --- Positive flows ---

test("TC-001 — Edit modal pre-populates Program Name and Description", async ({
  page,
}) => {
  const name = `Edit Prepop ${Date.now()}`;
  const desc = "Prepopulation test description";
  await createProgram(page, name, desc);

  const modal = await openEditModal(page, name);
  await expect(modal.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
  await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(desc);
});

test("TC-003 — Save Program Name only — modal closes, list re-fetches", async ({
  page,
}) => {
  const originalName = `Edit Name ${Date.now()}`;
  await createProgram(page, originalName, "Original description");

  const updatedName = `${originalName} Updated`;
  const modal = await openEditModal(page, originalName);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(updatedName);
  await modal.getByRole("button", { name: "Save" }).click();

  await expect(modal).not.toBeVisible();
  await expect(page.getByText(updatedName)).toBeVisible();
});

test("TC-005 — Description-only edit preserves Program Name", async ({
  page,
}) => {
  const name = `Preserve Name ${Date.now()}`;
  const originalDesc = "Original description";
  await createProgram(page, name, originalDesc);

  const modal = await openEditModal(page, name);
  await modal.getByRole("textbox", { name: "Description" }).fill("Updated description");
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();

  const reopened = await openEditModal(page, name);
  await expect(reopened.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
  await expect(reopened.getByRole("textbox", { name: "Description" })).toHaveValue(
    "Updated description"
  );
});

test("TC-007 — Clear Description saves", async ({ page }) => {
  const name = `Clear Desc ${Date.now()}`;
  await createProgram(page, name, "Will be cleared");

  const modal = await openEditModal(page, name);
  await modal.getByRole("textbox", { name: "Description" }).fill("");
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();

  const reopened = await openEditModal(page, name);
  await expect(reopened.getByRole("textbox", { name: "Description" })).toHaveValue("");
});

test("TC-009 — Collapse/expand AI Generation Config does not drop unsaved edits", async ({
  page,
}) => {
  const name = `Config Toggle ${Date.now()}`;
  await createProgram(page, name, "Config toggle test");

  const modal = await openEditModal(page, name);
  await expandAiConfigIfCollapsed(modal);
  await modal.getByRole("textbox", { name: "Focus Areas" }).fill("React; Node");

  await modal.getByRole("button", { name: /Hide AI Generation Config/ }).click();
  await modal.getByRole("button", { name: /Show AI Generation Config/ }).click();

  await expect(modal.getByRole("textbox", { name: "Focus Areas" })).toHaveValue(
    "React; Node"
  );
});

// --- Negative flows ---

test("TC-012 — Save disabled when Program Name empty", async ({ page }) => {
  const name = `Disabled Save ${Date.now()}`;
  await createProgram(page, name, "Test disabled save");

  const modal = await openEditModal(page, name);
  await modal.getByRole("textbox", { name: "Program Name" }).fill("");

  await expect(modal.getByRole("button", { name: "Save" })).toBeDisabled();
});

test("TC-019 — Close X without Save discards edits", async ({ page }) => {
  const name = `Discard X ${Date.now()}`;
  await createProgram(page, name, "Original");

  const modal = await openEditModal(page, name);
  await modal.getByRole("textbox", { name: "Program Name" }).fill("Should Not Save");
  await modal.getByRole("heading", { name: "Edit Program" }).locator("..").getByRole("button").click();
  await expect(modal).not.toBeVisible();

  const reopened = await openEditModal(page, name);
  await expect(reopened.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
});

test("TC-019b — Cancel without Save discards edits", async ({ page }) => {
  const name = `Discard Cancel ${Date.now()}`;
  await createProgram(page, name, "Original");

  const modal = await openEditModal(page, name);
  await modal.getByRole("textbox", { name: "Program Name" }).fill("Should Not Save");
  await modal.getByRole("button", { name: "Cancel" }).click();
  await expect(modal).not.toBeVisible();

  const reopened = await openEditModal(page, name);
  await expect(reopened.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
});

// --- Edge cases ---

test("TC-022 — Program Name 100 chars OK, 101 blocked", async ({ page }) => {
  const ts = Date.now();
  const name = `Len Test ${ts}`;
  await createProgram(page, name, "Length boundary test");

  const prefix = `L${ts}-`;
  const name100 = prefix + "X".repeat(100 - prefix.length);
  const modal = await openEditModal(page, name);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name100);
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: name100 })).toBeVisible();

  const modal2 = await openEditModal(page, name100);
  const name101 = prefix + "X".repeat(101 - prefix.length);
  await modal2.getByRole("textbox", { name: "Program Name" }).fill(name101);

  const saveBtn = modal2.getByRole("button", { name: "Save" });
  if (await saveBtn.isEnabled()) {
    await saveBtn.click();
    await expect(modal2).toBeVisible();
  } else {
    await expect(saveBtn).toBeDisabled();
  }
});

test("TC-025 — Special characters in name and description", async ({ page }) => {
  const name = `Special <>&"' ${Date.now()}`;
  const desc = 'Desc with <tag> & "quotes"';
  await createProgram(page, name, desc);

  const modal = await openEditModal(page, name);
  await expect(modal.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
  await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(desc);
});

test("TC-026 — Case-only rename succeeds (no false duplicate vs self)", async ({
  page,
}) => {
  const name = `case rename ${Date.now()}`;
  await createProgram(page, name, "Case rename test");

  const upperName = name.toUpperCase();
  const modal = await openEditModal(page, name);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(upperName);
  await modal.getByRole("button", { name: "Save" }).click();

  await expect(modal).not.toBeVisible();
  await expect(page.getByText(upperName)).toBeVisible();
});
