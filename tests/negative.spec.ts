import { test, expect } from "../fixtures/cleanup.fixture";

const TODO_URL = "https://demo.playwright.dev/todomvc/#/";

test.describe("Negative flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TODO_URL);
  });

  test("TC-013 — Empty input does not create a todo item", async ({ page }) => {
    await page.getByPlaceholder("What needs to be done?").press("Enter");

    await expect(page.getByTestId("todo-item")).toHaveCount(0);
  });

  test("TC-014 — Whitespace-only input does not create a todo item", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill("   ");
    await input.press("Enter");

    await expect(page.getByTestId("todo-item")).toHaveCount(0);
  });

  test("TC-015 — Removing the last item hides footer and toggle-all", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill("Buy groceries");
    await input.press("Enter");

    const todoItem = page.getByTestId("todo-item");
    await todoItem.hover();
    await todoItem.locator("button.destroy").click();

    await expect(page.locator(".footer")).toBeHidden();
    await expect(page.getByLabel("Mark all as complete")).toBeHidden();
  });

  test("TC-016 — Editing a todo to empty text removes it", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill("Buy groceries");
    await input.press("Enter");

    const todoItem = page.getByTestId("todo-item");
    await todoItem.dblclick();

    const editInput = todoItem.getByRole("textbox");
    await editInput.fill("");
    await editInput.press("Enter");

    await expect(page.getByTestId("todo-item")).toHaveCount(0);
  });
});
