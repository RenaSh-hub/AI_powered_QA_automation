import { test, expect, Page, Locator } from "@playwright/test";

const BASE_URL = process.env.DIDAXIS_URL ?? "https://test.didaxis.studio";

async function loginAndOpenPrograms(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByRole("textbox", { name: "Email" }).fill(process.env.DIDAXIS_EMAIL!);
  await page.getByRole("textbox", { name: "Password" }).fill(process.env.DIDAXIS_PASSWORD!);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL((url) => !url.pathname.includes("login"), {
    timeout: 30_000,
  });
  await page.goto(`${BASE_URL}/programs`);
  await page.waitForLoadState("networkidle");
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

/** AI config may reopen already expanded (Hide…) — only click Show when needed. */
async function expandAiConfigIfCollapsed(modal: Locator) {
  const showBtn = modal.getByRole("button", { name: /Show AI Generation Config/ });
  if (await showBtn.isVisible()) {
    await showBtn.click();
  }
}

test.beforeEach(async ({ page }) => {
  await loginAndOpenPrograms(page);
});

// --- Positive flows (ds2_testplan / DS-2) ---

test("TC-001 — Edit modal pre-populates Program Name and Description", async ({
  page,
}) => {
  const name = `DS2N Prepop ${Date.now()}`;
  const desc = "Full-stack cohort for 2026";
  await createProgram(page, name, desc);

  const modal = await openEditModal(page, name);
  await expect(modal.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
  await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(desc);
});

test("TC-002 — Pre-population matches data after Programs page reload", async ({
  page,
}) => {
  const name = `DS2N Reload ${Date.now()}`;
  await createProgram(page, name, "No stale data check");

  await page.reload();
  await page.waitForLoadState("networkidle");

  const modal = await openEditModal(page, name);
  await expect(modal.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
  await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(
    "No stale data check"
  );
});

test("TC-003 — Save Program Name only — modal closes, list updates, reopen preserves Description and AI config", async ({
  page,
}) => {
  const originalName = `DS2N NameOnly ${Date.now()}`;
  const description = "Full-stack cohort for 2026";
  await createProgram(page, originalName, description);

  let modal = await openEditModal(page, originalName);
  await modal.getByRole("button", { name: /Show AI Generation Config/ }).click();
  await modal.getByRole("textbox", { name: "Total Program Hours" }).fill("120");
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();

  const updatedName = `${originalName} - Updated`;
  modal = await openEditModal(page, originalName);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(updatedName);
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();

  await expect(page.getByRole("row").filter({ hasText: updatedName })).toBeVisible();

  modal = await openEditModal(page, updatedName);
  await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(description);
  await expandAiConfigIfCollapsed(modal);
  await expect(modal.getByRole("textbox", { name: "Total Program Hours" })).toHaveValue("120");
});

test("TC-005 — Description-only edit preserves Program Name", async ({ page }) => {
  const name = `DS2N DescOnly ${Date.now()}`;
  await createProgram(page, name, "Original description");

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

test("TC-006 — Config-only edit preserves Program Name and Description", async ({
  page,
}) => {
  const name = `DS2N ConfigOnly ${Date.now()}`;
  const desc = "Stable description";
  await createProgram(page, name, desc);

  let modal = await openEditModal(page, name);
  await modal.getByRole("button", { name: /Show AI Generation Config/ }).click();
  await modal.getByRole("textbox", { name: "Total Program Hours" }).fill("140");
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();

  modal = await openEditModal(page, name);
  await expect(modal.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
  await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(desc);
  await expandAiConfigIfCollapsed(modal);
  await expect(modal.getByRole("textbox", { name: "Total Program Hours" })).toHaveValue("140");
});

test("TC-007 — Clear Description saves", async ({ page }) => {
  const name = `DS2N ClearDesc ${Date.now()}`;
  await createProgram(page, name, "Will be cleared");

  const modal = await openEditModal(page, name);
  await modal.getByRole("textbox", { name: "Description" }).fill("");
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();

  const reopened = await openEditModal(page, name);
  await expect(reopened.getByRole("textbox", { name: "Description" })).toHaveValue("");
});

test("TC-008 — Edit without AI config: Program Name change still succeeds", async ({
  page,
}) => {
  const name = `DS2N NoConfig ${Date.now()}`;
  await createProgram(page, name, "No optional config");

  const newName = `${name} v2`;
  const modal = await openEditModal(page, name);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(newName);
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();
  await expect(page.getByText(newName)).toBeVisible();
});

test("TC-009 — Collapse/expand AI Generation Config does not drop unsaved edits", async ({
  page,
}) => {
  const name = `DS2N Toggle ${Date.now()}`;
  await createProgram(page, name, "Toggle test");

  const modal = await openEditModal(page, name);
  await modal.getByRole("button", { name: /Show AI Generation Config/ }).click();
  await modal.getByRole("textbox", { name: "Focus Areas" }).fill("React; Node");

  await modal.getByRole("button", { name: /Hide AI Generation Config/ }).click();
  await modal.getByRole("button", { name: /Show AI Generation Config/ }).click();

  await expect(modal.getByRole("textbox", { name: "Focus Areas" })).toHaveValue(
    "React; Node"
  );
});

// --- Negative flows ---

test("TC-012 — Save disabled when Program Name is empty", async ({ page }) => {
  const name = `DS2N EmptyName ${Date.now()}`;
  await createProgram(page, name, "Test");

  const modal = await openEditModal(page, name);
  await modal.getByRole("textbox", { name: "Program Name" }).fill("");

  await expect(modal.getByRole("button", { name: "Save" })).toBeDisabled();
});

test("TC-013 — Whitespace-only Program Name does not save", async ({ page }) => {
  const name = `DS2N Ws ${Date.now()}`;
  await createProgram(page, name, "Whitespace test");

  const modal = await openEditModal(page, name);
  await modal.getByRole("textbox", { name: "Program Name" }).fill("   ");

  const saveBtn = modal.getByRole("button", { name: "Save" });
  if (await saveBtn.isEnabled()) {
    await saveBtn.click();
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("textbox", { name: "Program Name" })).toBeVisible();
  } else {
    await expect(saveBtn).toBeDisabled();
  }
});

test("TC-011 — Duplicate active Program Name blocked on Save", async ({ page }) => {
  const a = `DS2N DupA ${Date.now()}`;
  const b = `DS2N DupB ${Date.now()}`;
  await createProgram(page, a, "First");
  await createProgram(page, b, "Second");

  const modal = await openEditModal(page, a);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(b);
  await modal.getByRole("button", { name: "Save" }).click();

  await expect(modal).toBeVisible();
  /* Plan + accessibility: failed duplicate save must expose feedback (see ds2_testplan “Error UX”).
     Today the API blocks but no role=alert / toast / inline message matches — test stays red until UX improves. */
  const duplicateHint = modal
    .getByRole("alert")
    .or(page.getByRole("alert"))
    .or(modal.getByText(/duplicate|already\s+exists|must\s+be\s+unique|name.*taken/i));

  await expect(
    duplicateHint.first(),
    "Duplicate save must surface visible feedback (alert, toast, or inline error text)",
  ).toBeVisible({ timeout: 8000 });
});

test("TC-014 — Duplicate name surfaces on Save after typing completes", async ({
  page,
}) => {
  const a = `DS2N LateA ${Date.now()}`;
  const b = `DS2N LateB ${Date.now()}`;
  await createProgram(page, a, "x");
  await createProgram(page, b, "y");

  const modal = await openEditModal(page, a);
  await modal.getByRole("textbox", { name: "Program Name" }).clear();
  await modal.getByRole("textbox", { name: "Program Name" }).pressSequentially(b, {
    delay: 40,
  });

  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).toBeVisible();
});

test("TC-019 — Cancel without Save discards Program Name edits", async ({ page }) => {
  const name = `DS2N Cancel ${Date.now()}`;
  await createProgram(page, name, "Original");

  const modal = await openEditModal(page, name);
  await modal.getByRole("textbox", { name: "Program Name" }).fill("Should Not Save");
  await modal.getByRole("button", { name: "Cancel" }).click();
  await expect(modal).not.toBeVisible();

  const reopened = await openEditModal(page, name);
  await expect(reopened.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
});

// --- Edge cases ---

test("TC-021 — Program Name trimmed on Save", async ({ page }) => {
  const name = `DS2N Trim ${Date.now()}`;
  await createProgram(page, name, "Trim test");

  const padded = `  ${name}  `;
  const modal = await openEditModal(page, name);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(padded);
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();

  const reopened = await openEditModal(page, name);
  await expect(reopened.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
});

test("TC-022 — Program Name 100 chars OK, 101 blocked or rejected", async ({ page }) => {
  const ts = Date.now();
  const baseName = `DS2N L${ts}`;
  await createProgram(page, baseName, "Length test");

  const prefix = `X${ts}-`;
  const name100 = prefix + "Y".repeat(100 - prefix.length);
  expect(name100.length).toBe(100);

  let modal = await openEditModal(page, baseName);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name100);
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: name100 })).toBeVisible();

  modal = await openEditModal(page, name100);
  const name101 = prefix + "Y".repeat(101 - prefix.length);
  expect(name101.length).toBe(101);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name101);

  const saveBtn = modal.getByRole("button", { name: "Save" });
  if (await saveBtn.isEnabled()) {
    await saveBtn.click();
    await expect(modal).toBeVisible();
  } else {
    await expect(saveBtn).toBeDisabled();
  }
});

test("TC-023 — Description 500 chars OK, 501 rejected or blocked", async ({ page }) => {
  const name = `DS2N Dlen ${Date.now()}`;
  await createProgram(page, name, "x");

  const d500 = "Z".repeat(500);
  const d501 = "Z".repeat(501);

  let modal = await openEditModal(page, name);
  await modal.getByRole("textbox", { name: "Description" }).fill(d500);
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();

  modal = await openEditModal(page, name);
  await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(d500);

  await modal.getByRole("textbox", { name: "Description" }).fill(d501);
  const saveBtn = modal.getByRole("button", { name: "Save" });
  if (await saveBtn.isEnabled()) {
    await saveBtn.click();
    await expect(modal).toBeVisible();
  } else {
    await expect(saveBtn).toBeDisabled();
  }
});

test("TC-025 — Special characters persist in name and description", async ({ page }) => {
  const name = `DS2N <>&"' ${Date.now()}`;
  const desc = 'Desc & <tag> "quotes"';
  await createProgram(page, name, desc);

  const modal = await openEditModal(page, name);
  await expect(modal.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
  await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(desc);
});

test("TC-026 — Case-only rename succeeds without false duplicate", async ({ page }) => {
  const name = `ds2n case ${Date.now()}`;
  await createProgram(page, name, "Case test");

  const upper = name.toUpperCase();
  const modal = await openEditModal(page, name);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(upper);
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();
  await expect(page.getByText(upper)).toBeVisible();
});

test("TC-029 — Name-only save with collapsed config does not wipe Total Hours", async ({
  page,
}) => {
  const name = `DS2N Collapsed ${Date.now()}`;
  await createProgram(page, name, "Has config");

  let modal = await openEditModal(page, name);
  await modal.getByRole("button", { name: /Show AI Generation Config/ }).click();
  await modal.getByRole("textbox", { name: "Total Program Hours" }).fill("99");
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();

  modal = await openEditModal(page, name);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(`${name} renamed`);
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();

  modal = await openEditModal(page, `${name} renamed`);
  await expandAiConfigIfCollapsed(modal);
  await expect(modal.getByRole("textbox", { name: "Total Program Hours" })).toHaveValue("99");
});

test("TC-004 — Admin saves Description and list updates", async ({ page }) => {
  const seedName = `DS2N DescAdmin ${Date.now()}`;
  await createProgram(page, seedName, "Seed description");

  const modal = await openEditModal(page, seedName);
  const newDesc = `Updated cohort description ${Date.now()}`;
  await modal.getByRole("textbox", { name: "Description" }).fill(newDesc);
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: newDesc })).toBeVisible();
});

test("TC-031 — Admin edits Program Name — modal closes, Description preserved", async ({
  page,
}) => {
  const seedName = `DS2N RenameAdmin ${Date.now()}`;
  const cohortDesc = "Full-stack cohort for 2026";
  await createProgram(page, seedName, cohortDesc);

  const updatedName = `Web Dev 2026 – Renamed ${Date.now()}`;
  const modal = await openEditModal(page, seedName);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(updatedName);
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).not.toBeVisible();

  await expect(page.getByRole("row").filter({ hasText: updatedName })).toBeVisible();

  const reopened = await openEditModal(page, updatedName);
  await expect(reopened.getByRole("textbox", { name: "Description" })).toHaveValue(
    cohortDesc,
  );
});
