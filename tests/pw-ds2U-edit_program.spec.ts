import { test, expect, type Page, type Locator } from "../fixtures/cleanup.fixture";
import { createProgram } from "../support/create-program";

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

function programRows(page: Page, name: string) {
  return page.getByRole("row").filter({ hasText: name });
}

function duplicateNameError(modal: Locator, page: Page) {
  return modal
    .getByRole("alert")
    .or(page.getByRole("alert"))
    .or(modal.getByText(/duplicate|already\s+exists|must\s+be\s+unique|name.*taken/i));
}

test.describe("PW-DS2U — Edit Program", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndOpenPrograms(page);
  });

  test.describe("Positive flows", () => {
    test("TC-001 — Edit modal pre-populates Program Name and Description", async ({
      page,
    }) => {
      const name = `PW2U Prepop ${Date.now()}`;
      const desc = "Full-stack cohort for 2026";
      await createProgram(page, name, desc);

      const modal = await openEditModal(page, name);
      await expect(modal.getByRole("heading", { name: "Edit Program" })).toBeVisible();
      await expect(modal.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
      await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(desc);
    });

    test("TC-002 — Pre-population matches data after Programs page reload", async ({
      page,
    }) => {
      const name = `PW2U Reload ${Date.now()}`;
      await createProgram(page, name, "No stale data check");

      await page.reload();
      await page.waitForLoadState("networkidle");

      const modal = await openEditModal(page, name);
      await expect(modal.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
      await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(
        "No stale data check"
      );
    });

    test("TC-002b — Successfully edit a program name (basic)", async ({ page }) => {
      const name = `PW2U BasicRename ${Date.now()}`;
      await createProgram(page, name, "Full-stack cohort for 2026");

      const updatedName = `${name} - Updated`;
      const modal = await openEditModal(page, name);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(updatedName);
      await modal.getByRole("button", { name: "Save" }).click();

      await expect(modal).not.toBeVisible();
      await expect(page.getByText(updatedName)).toBeVisible();
    });

    test("TC-003 — Save Program Name only — list updates, Description and AI config preserved", async ({
      page,
    }) => {
      const originalName = `PW2U NameOnly ${Date.now()}`;
      const description = "Full-stack cohort for 2026";
      await createProgram(page, originalName, description);

      let modal = await openEditModal(page, originalName);
      await expandAiConfigIfCollapsed(modal);
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
      await expect(modal.getByRole("textbox", { name: "Total Program Hours" })).toHaveValue(
        "120"
      );
    });

    test("TC-004 — Admin saves Description and list updates", async ({ page }) => {
      const seedName = `PW2U DescAdmin ${Date.now()}`;
      await createProgram(page, seedName, "Seed description");

      const modal = await openEditModal(page, seedName);
      const newDesc = `Updated cohort description ${Date.now()}`;
      await modal.getByRole("textbox", { name: "Description" }).fill(newDesc);
      await modal.getByRole("button", { name: "Save" }).click();
      await expect(modal).not.toBeVisible();
      await expect(page.getByRole("row").filter({ hasText: newDesc })).toBeVisible();
    });

    test("TC-005 — Description-only edit preserves Program Name", async ({ page }) => {
      const name = `PW2U DescOnly ${Date.now()}`;
      const originalDesc = "Full-stack cohort for 2026";
      await createProgram(page, name, originalDesc);

      let modal = await openEditModal(page, name);
      await modal.getByRole("textbox", { name: "Description" }).fill("Updated cohort description");
      await modal.getByRole("button", { name: "Save" }).click();
      await expect(modal).not.toBeVisible();
      await expect(page.getByText(name)).toBeVisible();

      modal = await openEditModal(page, name);
      await expect(modal.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
      await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(
        "Updated cohort description"
      );
    });

    test("TC-006 — Config-only edit preserves Program Name and Description", async ({
      page,
    }) => {
      const name = `PW2U ConfigOnly ${Date.now()}`;
      const desc = "Stable description";
      await createProgram(page, name, desc);

      let modal = await openEditModal(page, name);
      await expandAiConfigIfCollapsed(modal);
      await modal.getByRole("textbox", { name: "Total Program Hours" }).fill("140");
      await modal.getByRole("button", { name: "Save" }).click();
      await expect(modal).not.toBeVisible();

      modal = await openEditModal(page, name);
      await expect(modal.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
      await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(desc);
      await expandAiConfigIfCollapsed(modal);
      await expect(modal.getByRole("textbox", { name: "Total Program Hours" })).toHaveValue(
        "140"
      );
    });

    test("TC-007 — Clear Description saves", async ({ page }) => {
      const name = `PW2U ClearDesc ${Date.now()}`;
      await createProgram(page, name, "Full-stack cohort for 2026");

      let modal = await openEditModal(page, name);
      await modal.getByRole("textbox", { name: "Description" }).fill("");
      await modal.getByRole("button", { name: "Save" }).click();
      await expect(modal).not.toBeVisible();
      await expect(page.getByText(name)).toBeVisible();

      modal = await openEditModal(page, name);
      await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue("");
    });

    test("TC-008 — Edit without AI config: Program Name change still succeeds", async ({
      page,
    }) => {
      const name = `PW2U NoConfig ${Date.now()}`;
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
      const name = `PW2U Toggle ${Date.now()}`;
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

    test("TC-029 — Name-only save with collapsed config does not wipe Total Hours", async ({
      page,
    }) => {
      const name = `PW2U Collapsed ${Date.now()}`;
      await createProgram(page, name, "Has config");

      let modal = await openEditModal(page, name);
      await expandAiConfigIfCollapsed(modal);
      await modal.getByRole("textbox", { name: "Total Program Hours" }).fill("99");
      await modal.getByRole("button", { name: "Save" }).click();
      await expect(modal).not.toBeVisible();

      modal = await openEditModal(page, name);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(`${name} renamed`);
      await modal.getByRole("button", { name: "Save" }).click();
      await expect(modal).not.toBeVisible();

      modal = await openEditModal(page, `${name} renamed`);
      await expandAiConfigIfCollapsed(modal);
      await expect(modal.getByRole("textbox", { name: "Total Program Hours" })).toHaveValue(
        "99"
      );
    });

    test("TC-031 — Admin edits Program Name — modal closes, Description preserved", async ({
      page,
    }) => {
      const seedName = `PW2U RenameAdmin ${Date.now()}`;
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
        cohortDesc
      );
    });

    test("TC-024 — Program list re-fetches immediately after successful edit", async ({
      page,
    }) => {
      const name = `PW2U ListRefresh ${Date.now()}`;
      await createProgram(page, name, "List refresh test");

      const renamed = `Web Dev 2026 – Renamed ${Date.now()}`;
      const modal = await openEditModal(page, name);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(renamed);
      await modal.getByRole("button", { name: "Save" }).click();

      await expect(modal).not.toBeVisible();
      await expect(page.getByText(renamed)).toBeVisible({ timeout: 5_000 });
      await expect(page).toHaveURL(/\/programs/);
    });
  });

  test.describe("Negative flows", () => {
    test("TC-011 — Duplicate active Program Name blocked on Save", async ({ page }) => {
      const a = `PW2U DupA ${Date.now()}`;
      const b = `PW2U DupB ${Date.now()}`;
      await createProgram(page, a, "First");
      await createProgram(page, b, "Second");

      const modal = await openEditModal(page, a);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(b.toUpperCase());
      await modal.getByRole("button", { name: "Save" }).click();

      await expect(modal).toBeVisible();
      await expect(
        duplicateNameError(modal, page).first(),
        "Duplicate save must surface visible feedback (alert, toast, or inline error text)"
      ).toBeVisible({ timeout: 8_000 });
      await expect(page.getByText(a)).toBeVisible();
    });

    test("TC-012 — Save disabled when Program Name is empty", async ({ page }) => {
      const name = `PW2U EmptyName ${Date.now()}`;
      await createProgram(page, name, "Test");

      const modal = await openEditModal(page, name);
      await modal.getByRole("textbox", { name: "Program Name" }).fill("");

      await expect(modal.getByRole("button", { name: "Save" })).toBeDisabled();
    });

    test("TC-012b — Program is not updated when Save button is disabled (force click)", async ({
      page,
    }) => {
      const name = `PW2U ForceSave ${Date.now()}`;
      await createProgram(page, name, "Disabled save test");

      const modal = await openEditModal(page, name);
      await modal.getByRole("textbox", { name: "Program Name" }).fill("");
      const saveBtn = modal.getByRole("button", { name: "Save" });
      await expect(saveBtn).toBeDisabled();

      await saveBtn.click({ force: true });

      await expect(modal).toBeVisible();
      await expect(page.getByText(name)).toBeVisible();
    });

    test("TC-012c — Duplicate name error is not shown while typing", async ({ page }) => {
      const a = `PW2U TypeA ${Date.now()}`;
      const b = `PW2U TypeB ${Date.now()}`;
      await createProgram(page, a, "First");
      await createProgram(page, b, "Second");

      const modal = await openEditModal(page, a);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(b.toUpperCase());
      await page.waitForTimeout(600);

      await expect(duplicateNameError(modal, page)).toHaveCount(0);
    });

    test("TC-013 — Whitespace-only Program Name does not save", async ({ page }) => {
      const name = `PW2U Ws ${Date.now()}`;
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

      await expect(page.getByText(name)).toBeVisible();
    });

    test("TC-014 — Duplicate name surfaces on Save after typing completes", async ({
      page,
    }) => {
      const a = `PW2U LateA ${Date.now()}`;
      const b = `PW2U LateB ${Date.now()}`;
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

    test("TC-015 — Program is not updated without clicking Save", async ({ page }) => {
      const name = `PW2U NoSave ${Date.now()}`;
      await createProgram(page, name, "No save test");

      const modal = await openEditModal(page, name);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(`${name} - Updated`);

      await expect(modal).toBeVisible();
      await expect(page.getByText(name)).toBeVisible();
      await expect(programRows(page, `${name} - Updated`)).toHaveCount(0);
    });

    test("TC-019 — Cancel without Save discards Program Name edits", async ({ page }) => {
      const name = `PW2U Cancel ${Date.now()}`;
      await createProgram(page, name, "Original");

      const modal = await openEditModal(page, name);
      await modal.getByRole("textbox", { name: "Program Name" }).fill("Should Not Save");
      await modal.getByRole("button", { name: "Cancel" }).click();
      await expect(modal).not.toBeVisible();

      const reopened = await openEditModal(page, name);
      await expect(reopened.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
    });

    test("TC-019b — Cancel without Save discards Description edits", async ({ page }) => {
      const name = `PW2U CancelDesc ${Date.now()}`;
      const originalDesc = "Full-stack cohort for 2026";
      await createProgram(page, name, originalDesc);

      const modal = await openEditModal(page, name);
      await modal.getByRole("textbox", { name: "Description" }).fill("Unsaved change");
      await modal.getByRole("button", { name: "Cancel" }).click();
      await expect(modal).not.toBeVisible();

      const reopened = await openEditModal(page, name);
      await expect(reopened.getByRole("textbox", { name: "Description" })).toHaveValue(
        originalDesc
      );
    });

    test("TC-019c — Close X without Save discards edits", async ({ page }) => {
      const name = `PW2U DiscardX ${Date.now()}`;
      await createProgram(page, name, "Original");

      const modal = await openEditModal(page, name);
      await modal.getByRole("textbox", { name: "Program Name" }).fill("Should Not Save");
      await modal
        .getByRole("heading", { name: "Edit Program" })
        .locator("..")
        .getByRole("button")
        .click();
      await expect(modal).not.toBeVisible();

      await expect(page.getByText(name)).toBeVisible();
      await expect(programRows(page, "Should Not Save")).toHaveCount(0);
    });
  });

  test.describe("Edge cases", () => {
    test("TC-021 — Program Name trimmed on Save", async ({ page }) => {
      const name = `PW2U Trim ${Date.now()}`;
      await createProgram(page, name, "Trim test");

      const trimmedName = `${name} - Updated`;
      const modal = await openEditModal(page, name);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(`  ${trimmedName}  `);
      await modal.getByRole("button", { name: "Save" }).click();
      await expect(modal).not.toBeVisible();

      await expect(page.getByText(trimmedName)).toBeVisible();
      const reopened = await openEditModal(page, trimmedName);
      await expect(reopened.getByRole("textbox", { name: "Program Name" })).toHaveValue(
        trimmedName
      );
    });

    test("TC-022 — Program Name 100 chars OK, 101 blocked or rejected", async ({ page }) => {
      const ts = Date.now();
      const baseName = `PW2U L${ts}`;
      await createProgram(page, baseName, "Length test");

      const prefix = `X${ts}-`;
      const name100 = prefix + "Y".repeat(100 - prefix.length);
      expect(name100.length).toBe(100);

      let modal = await openEditModal(page, baseName);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(name100);
      await modal.getByRole("button", { name: "Save" }).click();
      await expect(modal).not.toBeVisible();
      await expect(programRows(page, name100)).toBeVisible();

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

      await expect(page.getByText(baseName)).not.toBeVisible();
      await expect(programRows(page, name100)).toBeVisible();
    });

    test("TC-023 — Description 500 chars OK, 501 rejected or blocked", async ({ page }) => {
      const name = `PW2U Dlen ${Date.now()}`;
      await createProgram(page, name, "x");

      const d500 = "Z".repeat(500);
      const d501 = "Z".repeat(501);

      let modal = await openEditModal(page, name);
      await modal.getByRole("textbox", { name: "Description" }).fill(d500);
      await modal.getByRole("button", { name: "Save" }).click();
      await expect(modal).not.toBeVisible();

      modal = await openEditModal(page, name);
      const savedDesc = await modal.getByRole("textbox", { name: "Description" }).inputValue();
      expect(savedDesc.length).toBe(500);

      await modal.getByRole("textbox", { name: "Description" }).fill(d501);
      const saveBtn = modal.getByRole("button", { name: "Save" });
      if (await saveBtn.isEnabled()) {
        await saveBtn.click();
        await expect(modal).toBeVisible();
      } else {
        await expect(saveBtn).toBeDisabled();
      }
    });

    test("TC-025 — Special characters persist in name and description on open", async ({
      page,
    }) => {
      const name = `PW2U <>&"' ${Date.now()}`;
      const desc = 'Desc & <tag> "quotes"';
      await createProgram(page, name, desc);

      const modal = await openEditModal(page, name);
      await expect(modal.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
      await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(desc);
    });

    test("TC-025b — Special characters accepted on edit save", async ({ page }) => {
      const name = `PW2U SpecialEdit ${Date.now()}`;
      await createProgram(page, name, "Original description");

      const specialName = "Informatique & IA - Niveau 2";
      const specialDesc = 'A & B <tag> "quotes"';
      const modal = await openEditModal(page, name);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(specialName);
      await modal.getByRole("textbox", { name: "Description" }).fill(specialDesc);
      await modal.getByRole("button", { name: "Save" }).click();

      await expect(modal).not.toBeVisible();
      await expect(page.getByText(specialName)).toBeVisible();
    });

    test("TC-026 — Case-only rename succeeds without false duplicate", async ({ page }) => {
      const name = `pw2u case ${Date.now()}`;
      await createProgram(page, name, "Case rename test");

      const upper = name.toUpperCase();
      const modal = await openEditModal(page, name);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(upper);
      await modal.getByRole("button", { name: "Save" }).click();
      await expect(modal).not.toBeVisible();
      await expect(page.getByText(upper)).toBeVisible();
    });

    // BUG: double-click Save may submit twice — no idempotency guard
    test.fail("TC-027 — Rapid double-click on Save sends only one update", async ({ page }) => {
      const name = `PW2U DblSave ${Date.now()}`;
      await createProgram(page, name, "Double-click test");

      const updatedName = `${name} - Updated`;
      const modal = await openEditModal(page, name);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(updatedName);
      await modal.getByRole("button", { name: "Save" }).dblclick();

      await expect(modal).not.toBeVisible();
      await expect(programRows(page, updatedName)).toHaveCount(1);
    });
  });
});
