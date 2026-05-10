# Test Plan — TodoMVC Application

**Application URL:** https://demo.playwright.dev/todomvc/#/  
**Framework:** React • TodoMVC  
**Prepared by:** QA Engineer  

---

## Acceptance Criteria

1. Create a todo list  
2. Add items (4)  
3. Finish item — expect to be finished  
4. Remove item from the list — expect to be removed  

---

## Positive Flows

### TC-001 — Todo item is created when pressing Enter

- **Preconditions:** TodoMVC app is open, no existing todos
- **Steps:**
  1. Click the "What needs to be done?" input field
  2. Type "Buy groceries"
  3. Press Enter
- **Expected result:** "Buy groceries" appears in the todo list; item count shows "1 item left"
- **Priority:** High

### TC-002 — Multiple todo items can be added sequentially

- **Preconditions:** TodoMVC app is open, no existing todos
- **Steps:**
  1. Add todo "Buy groceries" and press Enter
  2. Add todo "Clean the house" and press Enter
  3. Add todo "Walk the dog" and press Enter
  4. Add todo "Read a book" and press Enter
- **Expected result:** All 4 items appear in the list in order; item count shows "4 items left"
- **Priority:** High

### TC-003 — Todo item is marked as completed when toggled

- **Preconditions:** TodoMVC app is open with at least 1 todo item
- **Steps:**
  1. Add todo "Buy groceries"
  2. Click the toggle checkbox next to "Buy groceries"
- **Expected result:** Item has a strikethrough style; item count decreases by 1
- **Priority:** High

### TC-004 — Completed todo item can be unchecked to mark it active again

- **Preconditions:** A completed todo exists
- **Steps:**
  1. Add todo "Buy groceries" and mark it completed
  2. Click the toggle checkbox again on "Buy groceries"
- **Expected result:** Strikethrough is removed; item count increases by 1
- **Priority:** Medium

### TC-005 — Todo item is removed when the destroy button is clicked

- **Preconditions:** TodoMVC app is open with at least 1 todo item
- **Steps:**
  1. Add todo "Buy groceries"
  2. Hover over "Buy groceries"
  3. Click the destroy (×) button
- **Expected result:** "Buy groceries" is removed from the list; item count updates accordingly
- **Priority:** High

### TC-006 — Item count reflects only active (non-completed) items

- **Preconditions:** TodoMVC app is open with no existing todos
- **Steps:**
  1. Add 3 todo items
  2. Mark 1 item as completed
- **Expected result:** Footer shows "2 items left"
- **Priority:** High

### TC-007 — "All" filter shows both active and completed items

- **Preconditions:** Mix of active and completed items exist
- **Steps:**
  1. Add 3 items, complete 1
  2. Click the "All" filter link
- **Expected result:** All 3 items are visible (1 completed, 2 active)
- **Priority:** Medium

### TC-008 — "Active" filter shows only non-completed items

- **Preconditions:** Mix of active and completed items exist
- **Steps:**
  1. Add 3 items, complete 1
  2. Click the "Active" filter link
- **Expected result:** Only the 2 active items are visible
- **Priority:** Medium

### TC-009 — "Completed" filter shows only completed items

- **Preconditions:** Mix of active and completed items exist
- **Steps:**
  1. Add 3 items, complete 1
  2. Click the "Completed" filter link
- **Expected result:** Only the 1 completed item is visible
- **Priority:** Medium

### TC-010 — "Clear completed" removes all completed items

- **Preconditions:** At least 1 completed item exists
- **Steps:**
  1. Add 3 items, complete 2
  2. Click "Clear completed" button
- **Expected result:** Completed items are removed; only 1 active item remains
- **Priority:** Medium

### TC-011 — Todo item text can be edited by double-clicking

- **Preconditions:** At least 1 todo item exists
- **Steps:**
  1. Add todo "Buy groceries"
  2. Double-click on "Buy groceries"
  3. Clear the text and type "Buy organic groceries"
  4. Press Enter
- **Expected result:** Item text updates to "Buy organic groceries"
- **Priority:** Medium

### TC-012 — Toggle-all marks every item as completed

- **Preconditions:** Multiple active items exist
- **Steps:**
  1. Add 3 todo items
  2. Click the toggle-all chevron (❯) at the top of the list
- **Expected result:** All items are marked completed; item count shows "0 items left"
- **Priority:** Medium

---

## Negative Flows

### TC-013 — Empty input does not create a todo item

- **Preconditions:** TodoMVC app is open
- **Steps:**
  1. Click the input field
  2. Press Enter without typing anything
- **Expected result:** No item is added to the list; no item count footer appears
- **Priority:** High

### TC-014 — Whitespace-only input does not create a todo item

- **Preconditions:** TodoMVC app is open
- **Steps:**
  1. Click the input field
  2. Type "   " (spaces only)
  3. Press Enter
- **Expected result:** No item is added to the list
- **Priority:** High

### TC-015 — Removing the last item hides the footer and toggle-all

- **Preconditions:** Exactly 1 todo item exists
- **Steps:**
  1. Hover over the item and click the destroy (×) button
- **Expected result:** Item is removed; footer (filters and count) and toggle-all disappear
- **Priority:** Medium

### TC-016 — Editing a todo to empty text removes it

- **Preconditions:** At least 1 todo item exists
- **Steps:**
  1. Double-click on a todo item
  2. Clear all text
  3. Press Enter
- **Expected result:** The item is removed from the list
- **Priority:** Medium

---

## Edge Cases

### TC-017 — Todo item with special characters is preserved

- **Preconditions:** TodoMVC app is open
- **Steps:**
  1. Type `<script>alert("XSS")</script>` in the input
  2. Press Enter
- **Expected result:** Item is created with the literal text displayed (not executed as HTML)
- **Priority:** Medium

### TC-018 — Very long todo text is handled gracefully

- **Preconditions:** TodoMVC app is open
- **Steps:**
  1. Type a string of 500 characters into the input
  2. Press Enter
- **Expected result:** Item is created and displayed (may overflow or truncate visually, but data is preserved)
- **Priority:** Low

### TC-019 — Duplicate todo items are allowed

- **Preconditions:** TodoMVC app is open
- **Steps:**
  1. Add "Buy groceries" and press Enter
  2. Add "Buy groceries" again and press Enter
- **Expected result:** Two separate items both named "Buy groceries" appear in the list
- **Priority:** Low

### TC-020 — Leading and trailing whitespace is trimmed from todo text

- **Preconditions:** TodoMVC app is open
- **Steps:**
  1. Type "  Buy groceries  " (with leading/trailing spaces)
  2. Press Enter
- **Expected result:** Item is created with text "Buy groceries" (trimmed)
- **Priority:** Low

### TC-021 — Page reload persists todos via localStorage

- **Preconditions:** TodoMVC app is open with at least 1 item
- **Steps:**
  1. Add todo "Buy groceries"
  2. Reload the page
- **Expected result:** "Buy groceries" still appears in the list after reload
- **Priority:** Medium

---

## Ambiguities & Gaps in the ACs

1. **Filtering** — The ACs don't mention the All / Active / Completed filters, but they are core features of TodoMVC.
2. **Editing** — No mention of editing existing items via double-click.
3. **Clear completed** — No AC covers bulk removal of completed items.
4. **Toggle all** — No AC covers the mark-all-as-complete toggle.
5. **Persistence** — No mention of whether data should survive a page reload (localStorage).
6. **Input validation** — No AC specifies behavior for empty, whitespace-only, or very long inputs.
7. **"Add items (4)"** — Ambiguous whether exactly 4 items are required or this is just an example quantity.
