import { test, expect } from "../fixtures/cleanup.fixture";

const TODO_URL = "https://demo.playwright.dev/todomvc/#/";

const ITEMS = ["Buy groceries", "Clean the house", "Walk the dog", "Read a book"];

test.describe("Positive flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TODO_URL);
  });

  test("TC-001 — Todo item is created when pressing Enter", async ({ page }) => {
    await page.getByPlaceholder("What needs to be done?").fill("Buy groceries");
    await page.getByPlaceholder("What needs to be done?").press("Enter");

    await expect(page.getByTestId("todo-title")).toHaveText("Buy groceries");
    await expect(page.getByTestId("todo-count")).toContainText("1 item left");
  });

  test("TC-002 — Multiple todo items can be added sequentially", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");

    for (const item of ITEMS) {
      await input.fill(item);
      await input.press("Enter");
    }

    const todos = page.getByTestId("todo-title");
    await expect(todos).toHaveCount(4);

    for (let i = 0; i < ITEMS.length; i++) {
      await expect(todos.nth(i)).toHaveText(ITEMS[i]);
    }

    await expect(page.getByTestId("todo-count")).toContainText("4 items left");
  });

  test("TC-003 — Todo item is marked as completed when toggled", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill("Buy groceries");
    await input.press("Enter");

    const todoItem = page.getByTestId("todo-item");
    await todoItem.getByRole("checkbox").check();

    await expect(todoItem).toHaveClass(/completed/);
    await expect(page.getByTestId("todo-count")).toContainText("0 items left");
  });

  test("TC-004 — Completed todo can be unchecked to mark active again", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill("Buy groceries");
    await input.press("Enter");

    const checkbox = page.getByTestId("todo-item").getByRole("checkbox");
    await checkbox.check();
    await expect(page.getByTestId("todo-count")).toContainText("0 items left");

    await checkbox.uncheck();
    await expect(page.getByTestId("todo-item")).not.toHaveClass(/completed/);
    await expect(page.getByTestId("todo-count")).toContainText("1 item left");
  });

  test("TC-005 — Todo item is removed with the destroy button", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill("Buy groceries");
    await input.press("Enter");

    const todoItem = page.getByTestId("todo-item");
    await todoItem.hover();
    await todoItem.locator("button.destroy").click();

    await expect(page.getByTestId("todo-item")).toHaveCount(0);
  });

  test("TC-006 — Item count reflects only active items", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    for (const item of ITEMS.slice(0, 3)) {
      await input.fill(item);
      await input.press("Enter");
    }

    await page.getByTestId("todo-item").first().getByRole("checkbox").check();

    await expect(page.getByTestId("todo-count")).toContainText("2 items left");
  });

  test("TC-007 — 'All' filter shows both active and completed", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    for (const item of ITEMS.slice(0, 3)) {
      await input.fill(item);
      await input.press("Enter");
    }
    await page.getByTestId("todo-item").first().getByRole("checkbox").check();

    await page.getByRole("link", { name: "All" }).click();

    await expect(page.getByTestId("todo-item")).toHaveCount(3);
  });

  test("TC-008 — 'Active' filter shows only non-completed items", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    for (const item of ITEMS.slice(0, 3)) {
      await input.fill(item);
      await input.press("Enter");
    }
    await page.getByTestId("todo-item").first().getByRole("checkbox").check();

    await page.getByRole("link", { name: "Active" }).click();

    await expect(page.getByTestId("todo-item")).toHaveCount(2);
  });

  test("TC-009 — 'Completed' filter shows only completed items", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    for (const item of ITEMS.slice(0, 3)) {
      await input.fill(item);
      await input.press("Enter");
    }
    await page.getByTestId("todo-item").first().getByRole("checkbox").check();

    await page.getByRole("link", { name: "Completed" }).click();

    await expect(page.getByTestId("todo-item")).toHaveCount(1);
  });

  test("TC-010 — 'Clear completed' removes all completed items", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    for (const item of ITEMS.slice(0, 3)) {
      await input.fill(item);
      await input.press("Enter");
    }
    await page.getByTestId("todo-item").nth(0).getByRole("checkbox").check();
    await page.getByTestId("todo-item").nth(1).getByRole("checkbox").check();

    await page.getByRole("button", { name: "Clear completed" }).click();

    await expect(page.getByTestId("todo-item")).toHaveCount(1);
    await expect(page.getByTestId("todo-title")).toHaveText(ITEMS[2]);
  });

  test("TC-011 — Todo item text can be edited by double-clicking", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill("Buy groceries");
    await input.press("Enter");

    const todoItem = page.getByTestId("todo-item");
    await todoItem.dblclick();

    const editInput = todoItem.getByRole("textbox");
    await editInput.fill("Buy organic groceries");
    await editInput.press("Enter");

    await expect(page.getByTestId("todo-title")).toHaveText("Buy organic groceries");
  });

  test("TC-012 — Toggle-all marks every item as completed", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    for (const item of ITEMS.slice(0, 3)) {
      await input.fill(item);
      await input.press("Enter");
    }

    await page.getByLabel("Mark all as complete").check();

    const items = page.getByTestId("todo-item");
    for (let i = 0; i < 3; i++) {
      await expect(items.nth(i)).toHaveClass(/completed/);
    }
    await expect(page.getByTestId("todo-count")).toContainText("0 items left");
  });
});
