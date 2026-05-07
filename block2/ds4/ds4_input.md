# DS4 — User input (delete program test plan)

## Task: folder and artifacts

Inside **block2**, create **ds4** folder. Store the user’s prompt(s) in **ds4_input.md** and the assistant’s test plan in **ds4_output.md**.

---

## Prompt 1 — Create test plan for “Delete program with confirmation”

### Role

Senior QA engineer reviewing the feature described below.

### Task

Create a detailed test plan for the **Delete program with confirmation** feature.

### Description

As an admin user, I want to delete a program I no longer need, with a confirmation step to prevent accidental deletion.

### Acceptance Criteria

**Scenario: Delete program with confirmation**

- Given a program **Test Program** exists
- When I click the delete icon for **Test Program**
- Then I see a confirmation dialog
- When I confirm deletion
- Then **Test Program** is removed from the program list

**Scenario: Cancel program deletion**

- Given I click the delete icon for a program
- When I see the confirmation dialog
- And I click Cancel
- Then the program still exists in the list

### Context

The **Program Setup** page allows administrators and editors to create, edit, and delete academic programs. Each program serves as the top-level container for semesters, courses, and session templates.

### Target Users

- **Admin** — full CRUD access to programs  
- **Editor** — can create and edit programs, not able to delete  
- **Viewer** — read-only access to program list  

### Delete operation

| Item | Detail |
|------|--------|
| Operation | Delete |
| Flow | Click 🗑 icon on program row → confirmation dialog → Confirm |
| UI feedback | Program removed from list immediately |

### Validation rules — Delete confirmation

Deleting a program triggers a **native browser** confirmation dialog:

> Delete program “[program name]”? All its semesters and courses will be removed. This cannot be undone.

The user must click **OK** to confirm or **Cancel** to abort.

### Delete program flow

1. User clicks 🗑 icon on a program row → browser confirmation dialog appears  
2. Dialog text: **Delete program [name]? All its semesters and courses will be removed. This cannot be undone.**  
3. User clicks **OK** → API call to delete program  
   - On success: program removed from list immediately  
4. User clicks **Cancel** → no action taken  

### Requirements for the test plan

- Cover every AC with at least two test cases  
- Add edge cases the ACs don’t mention (boundary values, empty inputs, special characters, duplicates, max-length)  
- Add negative test cases (what should NOT happen)  
- Structure each test case as:  
  - ID (TC-001, TC-002, etc.)  
  - Title (expected behavior, not action)  
  - Preconditions  
  - Steps (numbered)  
  - Expected result  
  - Priority (High / Medium / Low)  
- Group by: Positive flows, Negative flows, Edge cases  

### Output requirements

- Structured test plan in Markdown  
- Use real field names and values, not placeholders  
- At the end: list any ambiguities or gaps in the ACs  

---

## Prompt 2 — Update

1. **Editor** and **Viewer** are **unable** to delete.
