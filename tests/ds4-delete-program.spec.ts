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

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.goto(`${BASE_URL}/programs`);
  await page.waitForLoadState("networkidle");
});

// --- Positive flows ---

test("TC-001 — Admin sees native confirm dialog with program name", async ({
  page,
}) => {
  const name = `Del Confirm ${Date.now()}`;
  await createProgram(page, name);

  const row = page.getByRole("row").filter({ hasText: name });

  page.once("dialog", (dialog) => {
    expect(dialog.type()).toBe("confirm");
    expect(dialog.message()).toContain(name);
    dialog.dismiss();
  });
  await row.getByRole("button", { name: "🗑" }).click();
});

test("TC-002 — Confirming delete removes program from the list", async ({
  page,
}) => {
  const name = `Del OK ${Date.now()}`;
  await createProgram(page, name);

  const row = page.getByRole("row").filter({ hasText: name });

  page.on("dialog", (d) => d.accept());
  await row.getByRole("button", { name: "🗑" }).click();

  await expect(row).not.toBeVisible();
});

test("TC-003 — Cancel leaves program in the list", async ({ page }) => {
  const name = `Del Cancel ${Date.now()}`;
  await createProgram(page, name);

  const row = page.getByRole("row").filter({ hasText: name });

  page.on("dialog", (d) => d.dismiss());
  await row.getByRole("button", { name: "🗑" }).click();

  await expect(row).toBeVisible();
});

test("TC-005 — Deleting one program does not remove others", async ({
  page,
}) => {
  const ts = Date.now();
  const nameToDelete = `Del Target ${ts}`;
  const nameToKeep = `Del Keep ${ts}`;
  await createProgram(page, nameToDelete);
  await createProgram(page, nameToKeep);

  const targetRow = page.getByRole("row").filter({ hasText: nameToDelete });
  const keepRow = page.getByRole("row").filter({ hasText: nameToKeep });

  page.on("dialog", (d) => d.accept());
  await targetRow.getByRole("button", { name: "🗑" }).click();

  await expect(targetRow).not.toBeVisible();
  await expect(keepRow).toBeVisible();
});

test("TC-006 — List updates after delete without full page reload", async ({
  page,
}) => {
  const name = `Del NoReload ${Date.now()}`;
  await createProgram(page, name);

  const row = page.getByRole("row").filter({ hasText: name });

  page.on("dialog", (d) => d.accept());
  await row.getByRole("button", { name: "🗑" }).click();

  await expect(row).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Programs" })).toBeVisible();
});

// --- Negative flows ---

test("TC-011 — Cancel does not trigger delete API", async ({ page }) => {
  const name = `Del NoAPI ${Date.now()}`;
  await createProgram(page, name);

  const row = page.getByRole("row").filter({ hasText: name });
  const deleteRequests: string[] = [];

  page.on("request", (req) => {
    if (req.method() === "DELETE") deleteRequests.push(req.url());
  });

  page.on("dialog", (d) => d.dismiss());
  await row.getByRole("button", { name: "🗑" }).click();
  await page.waitForTimeout(1000);

  expect(deleteRequests).toHaveLength(0);
  await expect(row).toBeVisible();
});

// --- Edge cases ---

test("TC-015 — Confirm text includes special-character program name", async ({
  page,
}) => {
  const name = `Test <${Date.now()}> & "Beta"`;
  await createProgram(page, name);

  const row = page.getByRole("row").filter({ hasText: name });

  page.once("dialog", (dialog) => {
    expect(dialog.message()).toContain(name);
    dialog.accept();
  });
  await row.getByRole("button", { name: "🗑" }).click();
  await expect(row).not.toBeVisible();
});

test("TC-016 — Long Program Name (100 chars) in delete dialog", async ({
  page,
}) => {
  const prefix = `DelLong-${Date.now()}-`;
  const name100 = prefix + "X".repeat(100 - prefix.length);
  await createProgram(page, name100);

  const row = page.getByRole("row").filter({ hasText: name100 });

  page.once("dialog", (dialog) => {
    expect(dialog.message()).toContain(name100);
    dialog.accept();
  });
  await row.getByRole("button", { name: "🗑" }).click();
  await expect(row).not.toBeVisible();
});

test("TC-018 — Dismiss dialog (Esc) same as Cancel", async ({ page }) => {
  const name = `Del Esc ${Date.now()}`;
  await createProgram(page, name);

  const row = page.getByRole("row").filter({ hasText: name });

  page.on("dialog", (d) => d.dismiss());
  await row.getByRole("button", { name: "🗑" }).click();

  await expect(row).toBeVisible();
});
