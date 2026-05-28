import { test, expect } from "../fixtures/cleanup.fixture";

const TODO_URL = "https://demo.playwright.dev/todomvc/#/";

test.describe("Edge cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TODO_URL);
  });

  test("TC-017 — Special characters are preserved, not executed", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill('<script>alert("XSS")</script>');
    await input.press("Enter");

    await expect(page.getByTestId("todo-title")).toHaveText('<script>alert("XSS")</script>');
  });

  test("TC-018 — Very long todo text is handled gracefully", async ({ page }) => {
    const longText = "A".repeat(500);
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill(longText);
    await input.press("Enter");

    await expect(page.getByTestId("todo-title")).toHaveText(longText);
  });

  test("TC-019 — Duplicate todo items are allowed", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill("Buy groceries");
    await input.press("Enter");
    await input.fill("Buy groceries");
    await input.press("Enter");

    const todos = page.getByTestId("todo-title");
    await expect(todos).toHaveCount(2);
    await expect(todos.nth(0)).toHaveText("Buy groceries");
    await expect(todos.nth(1)).toHaveText("Buy groceries");
  });

  test("TC-020 — Leading and trailing whitespace is trimmed", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill("  Buy groceries  ");
    await input.press("Enter");

    await expect(page.getByTestId("todo-title")).toHaveText("Buy groceries");
  });

  test("TC-021 — Todos persist after page reload via localStorage", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill("Buy groceries");
    await input.press("Enter");

    await page.reload();

    await expect(page.getByTestId("todo-title")).toHaveText("Buy groceries");
  });
});
