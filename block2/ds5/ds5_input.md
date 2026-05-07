# DS5 — User input (Program list filtering and display)

## Task

Create a detailed test plan for the **Program list filtering and display** feature.

## Description

As an admin user, I want to see all programs in clear list so that I can quickly find and manage them.

## Navigation

- URL: `/programs`
- Sidebar: **Programs** menu item
- From program list, click a program row to see its semesters
- From semester panel, click **“Manage Courses”** to navigate to Course Builder

## Page Layout

The Programs page (`/programs`) displays:

- Header: **“Programs”** title with **“+ New Program”** button (visible to **ADMIN** and **EDITOR** roles)
- Program List: Table with **Program Name**, **Description preview**, **edit** and **delete** action icons
- Semester Panel: Appears to the right when a program row is clicked — shows **semesters, holidays, breaks**

## Empty State

When no programs exist, the page shows:

- 🎓 icon
- Text: **“No programs yet. Create your first program to get started.”**
- **“Create Program”** button

## List Refresh Behavior (Critical)

After any mutation (**create, edit, delete**), the program list MUST immediately reflect the change without requiring a manual page refresh.

This is a core UX requirement. The list is **re-fetched from the server after every successful mutation** to ensure data consistency.

## Acceptance Criteria

Scenario: Display program list with key details
  Given programs exist in the system
  When I navigate to the Programs page
  Then I see a list showing each program's name and description

Scenario: Empty state when no programs exist
  Given no programs exist
  When I navigate to the Programs page
  Then I see a message indicating no programs have been created
  And I see a prompt to create the first program

## Additional request

Add test cases for filtering by **Program Name** and **Program Start Date**.

## Requirements for the test plan

- Cover every AC with at least two test cases
- Add edge cases the ACs don't mention (boundary values, empty inputs, special characters, duplicates, max-length)
- Add negative test cases (what should NOT happen)
- Structure each test case as:
  - ID (TC-001, TC-002, etc.)
  - Title (expected behavior, not action)
  - Preconditions
  - Steps (numbered)
  - Expected result
  - Priority (High / Medium / Low)
- Group by: Positive flows, Negative flows, Edge cases

## Output

- Structured test plan in Markdown
- Use real field names and values, not placeholders
- At the end: list any ambiguities or gaps in the ACs
