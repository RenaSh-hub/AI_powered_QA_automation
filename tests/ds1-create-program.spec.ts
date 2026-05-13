import { test, expect } from "@playwright/test";

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

test("TC-001 — Program creation form is displayed with required fields", async ({
  page,
}) => {
  await page.getByRole("button", { name: "+ New Program" }).click();

  const modal = page.getByRole("dialog", { name: "New Program" });
  await expect(modal).toBeVisible();
  await expect(modal.getByRole("textbox", { name: "Program Name" })).toBeVisible();
  await expect(modal.getByRole("textbox", { name: "Description" })).toBeVisible();
  await expect(modal.getByRole("button", { name: "Create" })).toBeVisible();
});

test("TC-002 — Program is created successfully with valid inputs", async ({
  page,
}) => {
  const programName = `Web Development ${Date.now()}`;
  const description = "Full-stack web development program";

  await page.getByRole("button", { name: "+ New Program" }).click();

  const modal = page.getByRole("dialog", { name: "New Program" });
  await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
  await modal.getByRole("textbox", { name: "Description" }).fill(description);
  await modal.getByRole("button", { name: "Create" }).click();

  await expect(modal).not.toBeVisible();
  await expect(page.getByText(programName)).toBeVisible();
});
