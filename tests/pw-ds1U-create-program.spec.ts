import { test, expect, type Page } from "../fixtures/cleanup.fixture";
import { submitCreateAndTrack, waitForCreatedProgramId } from "../support/create-program";

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

async function openCreateModal(page: Page) {
  await page.getByRole("button", { name: "+ New Program" }).click();
  const modal = page.getByRole("dialog", { name: "New Program" });
  await expect(modal).toBeVisible();
  return modal;
}

function programRows(page: Page, name: string) {
  return page.getByRole("row").filter({ hasText: name });
}

async function expandAiConfigIfCollapsed(modal: Locator) {
  const showBtn = modal.getByRole("button", { name: /Show AI Generation Config/ });
  if (await showBtn.isVisible()) {
    await showBtn.click();
  }
}

test.describe("PW-DS1U — Create Program", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndOpenPrograms(page);
  });

  test.describe("Positive flows", () => {
    test("TC-001 — Navigate to program creation form with required fields", async ({
      page,
    }) => {
      await expect(page).toHaveURL(/\/programs/);
      await expect(page.getByRole("button", { name: "+ New Program" })).toBeVisible();

      const modal = await openCreateModal(page);

      await expect(modal.getByRole("heading", { name: "New Program" })).toBeVisible();
      await expect(modal.getByRole("textbox", { name: "Program Name" })).toBeVisible();
      await expect(modal.getByRole("textbox", { name: "Description" })).toBeVisible();
      await expect(modal.getByRole("button", { name: "Create" })).toBeVisible();
    });

    test("TC-002 — Program is created successfully with valid inputs", async ({
      page,
    }) => {
      const programName = `PW1U Web Development ${Date.now()}`;
      const description = "Full-stack web development program";

      const modal = await openCreateModal(page);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
      await modal.getByRole("textbox", { name: "Description" }).fill(description);
      await submitCreateAndTrack(page, modal);

      await expect(modal).not.toBeVisible();
      await expect(programRows(page, programName)).toBeVisible();
    });

    test("TC-003 — Validation prevents empty program name", async ({ page }) => {
      const modal = await openCreateModal(page);

      await expect(modal.getByRole("textbox", { name: "Program Name" })).toHaveValue("");
      await expect(modal.getByRole("button", { name: "Create" })).toBeDisabled();
    });

    test("TC-004 — Create a program with an empty description", async ({ page }) => {
      const programName = `PW1U Cloud Engineering ${Date.now()}`;

      const modal = await openCreateModal(page);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
      await submitCreateAndTrack(page, modal);

      await expect(modal).not.toBeVisible();
      await expect(programRows(page, programName)).toBeVisible();
    });
  });

  test.describe("Negative flows", () => {
    test("TC-005 — Program is not created when Create button is disabled", async ({
      page,
    }) => {
      const modal = await openCreateModal(page);
      const createBtn = modal.getByRole("button", { name: "Create" });

      await expect(modal.getByRole("textbox", { name: "Program Name" })).toHaveValue("");
      await expect(createBtn).toBeDisabled();

      const beforeCount = await page.getByRole("row").count();
      await createBtn.click({ force: true });

      await expect(modal).toBeVisible();
      await expect(page.getByRole("row")).toHaveCount(beforeCount);
    });

    test("TC-006 — Program is not created without submitting the form", async ({
      page,
    }) => {
      const programName = `PW1U NoSubmit ${Date.now()}`;
      const description = "Full-stack web development program";

      const modal = await openCreateModal(page);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
      await modal.getByRole("textbox", { name: "Description" }).fill(description);

      await expect(modal).toBeVisible();
      await expect(programRows(page, programName)).toHaveCount(0);
    });

    test("TC-007 — Closing the modal without saving does not create a program", async ({
      page,
    }) => {
      const programName = `PW1U Cancel ${Date.now()}`;
      const description = "Machine learning fundamentals";

      const modal = await openCreateModal(page);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
      await modal.getByRole("textbox", { name: "Description" }).fill(description);
      await modal.getByRole("button", { name: "Cancel" }).click();

      await expect(modal).not.toBeVisible();
      await expect(programRows(page, programName)).toHaveCount(0);
    });

    test("TC-007b — Close X without saving does not create a program", async ({ page }) => {
      const programName = `PW1U CloseX ${Date.now()}`;
      const description = "Machine learning fundamentals";

      const modal = await openCreateModal(page);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
      await modal.getByRole("textbox", { name: "Description" }).fill(description);
      await modal
        .getByRole("heading", { name: "New Program" })
        .locator("..")
        .getByRole("button")
        .click();

      await expect(modal).not.toBeVisible();
      await expect(programRows(page, programName)).toHaveCount(0);
    });
  });

  test.describe("Edge cases", () => {
    test("TC-008 — Program name with leading and trailing whitespace is handled on submit", async ({
      page,
    }) => {
      const trimmedName = `PW1U Trim ${Date.now()}`;
      const paddedName = `  ${trimmedName}  `;
      const description = "Full-stack web development program";

      const modal = await openCreateModal(page);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(paddedName);
      await modal.getByRole("textbox", { name: "Description" }).fill(description);
      await submitCreateAndTrack(page, modal);

      await expect(modal).not.toBeVisible();
      await expect(page.getByText(trimmedName)).toBeVisible();
      await expect(programRows(page, paddedName.trim())).toHaveCount(1);
    });

    test("TC-009 — Program name with only whitespace is treated as empty", async ({
      page,
    }) => {
      const modal = await openCreateModal(page);
      await modal.getByRole("textbox", { name: "Program Name" }).fill("   ");
      await modal
        .getByRole("textbox", { name: "Description" })
        .fill("Full-stack web development program");

      await expect(modal.getByRole("button", { name: "Create" })).toBeDisabled();
    });

    test("TC-010 — Program name with special characters is accepted", async ({
      page,
    }) => {
      const programName = `PW1U Informatique & IA - Niveau 2 ${Date.now()}`;
      const description = "Bilingual STEM program";

      const modal = await openCreateModal(page);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
      await modal.getByRole("textbox", { name: "Description" }).fill(description);
      await submitCreateAndTrack(page, modal);

      await expect(modal).not.toBeVisible();
      await expect(programRows(page, programName)).toBeVisible();
    });

    test("TC-013 — Program Name at maximum length of 100 characters is accepted", async ({
      page,
    }) => {
      const prefix = `PW1U-Len100-${Date.now()}-`;
      const name100 = prefix + "X".repeat(100 - prefix.length);
      expect(name100.length).toBe(100);

      const modal = await openCreateModal(page);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(name100);
      await submitCreateAndTrack(page, modal);

      await expect(modal).not.toBeVisible();
      await expect(programRows(page, name100)).toBeVisible();
    });

    test("TC-014 — Program Name exceeding 100 characters is rejected", async ({ page }) => {
      const prefix = `PW1U-Over100-${Date.now()}-`;
      const name101 = prefix + "X".repeat(101 - prefix.length);
      expect(name101.length).toBe(101);

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

    test("TC-015 — Description at maximum length of 500 characters is accepted", async ({
      page,
    }) => {
      const name = `PW1U Desc500 ${Date.now()}`;
      const desc500 = "D".repeat(500);

      const modal = await openCreateModal(page);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
      await modal.getByRole("textbox", { name: "Description" }).fill(desc500);
      await submitCreateAndTrack(page, modal);

      await expect(modal).not.toBeVisible();
      await expect(programRows(page, name)).toBeVisible();
    });

    test("TC-016 — Description exceeding 500 characters is rejected", async ({ page }) => {
      const name = `PW1U Desc501 ${Date.now()}`;
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

    // BUG: app allows duplicate names — no server-side uniqueness (DS-1 related defects)
    test.fail("TC-017 — Duplicate Program Name is rejected with a server error", async ({
      page,
    }) => {
      const name = `PW1U Dup ${Date.now()}`;
      const modal = await openCreateModal(page);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
      await submitCreateAndTrack(page, modal);
      await expect(modal).not.toBeVisible();

      const modal2 = await openCreateModal(page);
      await modal2.getByRole("textbox", { name: "Program Name" }).fill(name);
      await modal2.getByRole("textbox", { name: "Description" }).fill("Duplicate attempt");
      await modal2.getByRole("button", { name: "Create" }).click();

      await expect(modal2).toBeVisible();
      await expect(modal2.getByText(/already exists|duplicate/i)).toBeVisible();
    });

    test("TC-018 — Program Name supports accented characters without corruption", async ({
      page,
    }) => {
      const name = `PW1U Économie Avancée ${Date.now()}`;

      const modal = await openCreateModal(page);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
      await submitCreateAndTrack(page, modal);

      await expect(modal).not.toBeVisible();
      await expect(programRows(page, name)).toBeVisible();
    });

    test("TC-019 — Program Name containing quotes/brackets is displayed safely", async ({
      page,
    }) => {
      const name = `PW1U AI "Foundations" (Level ${Date.now()})`;

      const modal = await openCreateModal(page);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
      await submitCreateAndTrack(page, modal);

      await expect(modal).not.toBeVisible();
      await expect(programRows(page, name)).toBeVisible();
    });

    test("TC-020 — Optional AI Generation Config is available on create form", async ({
      page,
    }) => {
      const modal = await openCreateModal(page);
      await expect(
        modal.getByRole("button", { name: /Show AI Generation Config/ })
      ).toBeVisible();

      await expandAiConfigIfCollapsed(modal);
      await expect(modal.getByRole("textbox", { name: "Total Program Hours" })).toBeVisible();
      await modal.getByRole("button", { name: "Cancel" }).click();
    });

    // BUG: double-click submits twice — no idempotency guard (DS-17, SS-26)
    test.fail("TC-011 — Rapid double-click on Create creates only one program", async ({
      page,
    }) => {
      const programName = `PW1U Mobile ${Date.now()}`;
      const description = "iOS and Android development";

      const modal = await openCreateModal(page);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
      await modal.getByRole("textbox", { name: "Description" }).fill(description);
      const firstCreated = waitForCreatedProgramId(page);
      const secondCreated = waitForCreatedProgramId(page);
      await modal.getByRole("button", { name: "Create" }).dblclick();
      await Promise.allSettled([firstCreated, secondCreated]);

      await expect(modal).not.toBeVisible();
      await expect(programRows(page, programName)).toHaveCount(1);
    });

    test("TC-012 — Program list updates immediately after successful creation", async ({
      page,
    }) => {
      const programName = `PW1U Cybersecurity ${Date.now()}`;
      const description = "Network and application security";

      const modal = await openCreateModal(page);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
      await modal.getByRole("textbox", { name: "Description" }).fill(description);
      await submitCreateAndTrack(page, modal);

      await expect(modal).not.toBeVisible();
      await expect(programRows(page, programName)).toBeVisible({ timeout: 5_000 });
      await expect(page).toHaveURL(/\/programs/);
    });

    test("TC-021 — Modal dismisses promptly after successful Create", async ({ page }) => {
      const programName = `PW1U ModalTiming ${Date.now()}`;
      const description = "Modal dismiss timing check";

      const modal = await openCreateModal(page);
      await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
      await modal.getByRole("textbox", { name: "Description" }).fill(description);

      const started = Date.now();
      await submitCreateAndTrack(page, modal);
      await expect(modal).not.toBeVisible({ timeout: 5_000 });
      const elapsed = Date.now() - started;

      expect(elapsed).toBeLessThan(5_000);
      await expect(programRows(page, programName)).toBeVisible();
    });
  });
});
