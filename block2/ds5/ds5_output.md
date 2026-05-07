# Test plan: Program list filtering and display (with filters)

**Scope:** `/programs` page layout, program table display (name + description preview + edit/delete icons), empty state, right-side **Semester Panel** behavior, **filtering by Program Name and Program Start Date**, and **critical list refresh** after mutations (create/edit/delete) without manual refresh.

**Roles:**
- **Admin**: can see **+ New Program**, edit, delete
- **Editor**: can see **+ New Program**, edit (delete not defined in this spec)
- **Viewer**: read-only (button visibility/actions should be restricted)

---

## 1. Positive flows

### TC-001
- **Title:** Programs page shows a list with each program’s name and description preview
- **Preconditions:** Logged in as **Admin**; programs exist: `Web Development 2026` (Description: `Full-stack cohort for 2026`) and `Data Science 2026` (Description: `Python, stats, and ML fundamentals`)
- **Steps:**
  1. Navigate to `/programs`.
  2. Observe the program list table rows.
- **Expected result:** Each program row shows **Program Name** and a **Description preview** for both programs.
- **Priority:** High

### TC-002
- **Title:** Programs page header and “+ New Program” button are visible for Admin
- **Preconditions:** Logged in as **Admin**
- **Steps:**
  1. Navigate to `/programs`.
  2. Observe the header area.
- **Expected result:** Header title **“Programs”** is visible and **“+ New Program”** button is present.
- **Priority:** High

### TC-003
- **Title:** “+ New Program” button is visible for Editor
- **Preconditions:** Logged in as **Editor**
- **Steps:**
  1. Navigate to `/programs`.
  2. Observe the header area.
- **Expected result:** **“+ New Program”** button is present for Editor.
- **Priority:** High

### TC-004
- **Title:** Clicking a program row opens the Semester Panel with semester-related content
- **Preconditions:** Logged in as **Admin**; program `Web Development 2026` exists with semesters configured
- **Steps:**
  1. Navigate to `/programs`.
  2. Click the row for `Web Development 2026`.
- **Expected result:** **Semester Panel** appears on the right and shows **semesters, holidays, breaks** for the selected program.
- **Priority:** High

### TC-005
- **Title:** “Manage Courses” navigates to Course Builder from the Semester Panel
- **Preconditions:** Logged in as **Admin**; `Web Development 2026` exists; Semester Panel can be opened
- **Steps:**
  1. Navigate to `/programs`.
  2. Click `Web Development 2026` row.
  3. In the Semester Panel, click **“Manage Courses”**.
- **Expected result:** User navigates to **Course Builder** (destination URL/path per app routing).
- **Priority:** High

### TC-006
- **Title:** Program list reflects a successful create without manual refresh (server re-fetch)
- **Preconditions:** Logged in as **Admin**; currently on `/programs`
- **Steps:**
  1. Click **+ New Program**.
  2. Create program with **Program Name** `Cloud Engineering 2026` and **Description** `AWS + containers + CI/CD`.
  3. Save successfully.
  4. Observe `/programs` list.
- **Expected result:** List is **re-fetched** and shows `Cloud Engineering 2026` immediately; no browser refresh needed.
- **Priority:** High

### TC-007
- **Title:** Program list reflects a successful edit without manual refresh (server re-fetch)
- **Preconditions:** Logged in as **Admin**; `Web Development 2026` exists
- **Steps:**
  1. Edit `Web Development 2026` to `Web Development 2026 - Updated`.
  2. Save successfully.
  3. Observe `/programs` list.
- **Expected result:** List is re-fetched and shows `Web Development 2026 - Updated` immediately.
- **Priority:** High

### TC-008
- **Title:** Program list reflects a successful delete without manual refresh (server re-fetch)
- **Preconditions:** Logged in as **Admin**; program `Test Program` exists
- **Steps:**
  1. Delete `Test Program` successfully (including confirmation if applicable).
  2. Observe `/programs` list.
- **Expected result:** List is re-fetched and `Test Program` is gone immediately; no manual refresh needed.
- **Priority:** High

### TC-020
- **Title:** Program Name filter returns only programs whose names match the query
- **Preconditions:** Admin on `/programs`; programs exist: `Web Development 2026`, `Web Development 2027`, `Data Science 2026`
- **Steps:**
  1. In **Program Name** filter, enter `Web Development`.
  2. Wait for results to update.
- **Expected result:** List shows `Web Development 2026` and `Web Development 2027` only; `Data Science 2026` is not shown.
- **Priority:** High

### TC-021
- **Title:** Program Name filter supports partial matching (substring)
- **Preconditions:** Admin on `/programs`; program `Informatique & IA - Niveau 2` exists
- **Steps:**
  1. Enter `Niveau` in the **Program Name** filter.
- **Expected result:** `Informatique & IA - Niveau 2` appears in results.
- **Priority:** Medium

### TC-022
- **Title:** Program Start Date filter returns only programs matching the selected date (or range)
- **Preconditions:** Admin on `/programs`; programs exist with start dates: `Web Development 2026` (2026-01-10), `Data Science 2026` (2026-03-01), `Cloud Engineering 2026` (2026-01-10)
- **Steps:**
  1. Set **Program Start Date** filter to `2026-01-10` (or set range start/end to that date).
- **Expected result:** Only programs starting on `2026-01-10` are listed (`Web Development 2026`, `Cloud Engineering 2026`); `Data Science 2026` is excluded.
- **Priority:** High

### TC-023
- **Title:** Combined filters (Program Name + Start Date) intersect results correctly
- **Preconditions:** Same as TC-022
- **Steps:**
  1. Set **Program Start Date** filter to `2026-01-10`.
  2. Set **Program Name** filter to `Cloud`.
- **Expected result:** Only `Cloud Engineering 2026` remains.
- **Priority:** High

### TC-024
- **Title:** Clearing filters restores the full unfiltered program list
- **Preconditions:** Admin on `/programs`; filters currently applied with a reduced result set
- **Steps:**
  1. Clear **Program Name** filter.
  2. Clear **Program Start Date** filter.
- **Expected result:** Full list of programs returns.
- **Priority:** High

---

## 2. Negative flows

### TC-009
- **Title:** Viewer must not see “+ New Program” button
- **Preconditions:** Logged in as **Viewer**
- **Steps:**
  1. Navigate to `/programs`.
  2. Observe header actions.
- **Expected result:** **“+ New Program”** button is **not visible** to Viewer.
- **Priority:** High

### TC-010
- **Title:** Program list does not show a fake new row if create fails
- **Preconditions:** Logged in as **Admin**; create API will fail (e.g., server 400)
- **Steps:**
  1. Click **+ New Program**.
  2. Enter invalid data to trigger failure (e.g., Program Name length 101 chars if enforced).
  3. Attempt to save.
  4. Observe list after the error.
- **Expected result:** Error is shown (per UX). Program list does **not** include the failed program.
- **Priority:** High

### TC-011
- **Title:** Program list does not show updated values if edit fails
- **Preconditions:** Logged in as **Admin**; edit API will fail (e.g., 409 duplicate)
- **Steps:**
  1. Attempt rename `Web Development 2026` to an existing name (e.g., `Data Science 2026`).
  2. Save (expect failure).
  3. Observe list.
- **Expected result:** Error shown. List does **not** change the program name to the rejected value.
- **Priority:** High

### TC-012
- **Title:** Clicking a program row must not navigate away unexpectedly
- **Preconditions:** Logged in as **Admin**; programs exist
- **Steps:**
  1. Navigate to `/programs`.
  2. Click on a program row (not on an action icon).
- **Expected result:** User stays on `/programs`; only the **Semester Panel** changes/appears.
- **Priority:** Medium

### TC-013
- **Title:** Manage Courses is not available if no program is selected
- **Preconditions:** Logged in as **Admin**; `/programs` loaded; no row clicked yet
- **Steps:**
  1. Observe right side area (Semester Panel region).
- **Expected result:** No **“Manage Courses”** action is available until a program is selected (or it is disabled/hidden).
- **Priority:** Medium

### TC-025
- **Title:** No results state is shown when filters match zero programs
- **Preconditions:** Admin on `/programs`; programs exist
- **Steps:**
  1. Enter `Nonexistent Program` in **Program Name** filter.
- **Expected result:** List shows zero results with an appropriate “no matches” state; no stale rows remain.
- **Priority:** Medium

### TC-026
- **Title:** Invalid date input does not crash the page or apply a broken filter
- **Preconditions:** Admin on `/programs`; start date filter allows typing (if applicable)
- **Steps:**
  1. Type an invalid value into **Program Start Date** filter (e.g., `2026-99-99`).
- **Expected result:** Filter is not applied (or field shows validation); list remains stable; no UI crash.
- **Priority:** Medium

---

## 3. Edge cases

### TC-014
- **Title:** Empty state renders correct icon, message, and “Create Program” button when no programs exist
- **Preconditions:** Logged in as **Admin**; system has **0** programs
- **Steps:**
  1. Navigate to `/programs`.
- **Expected result:** Shows 🎓 icon, text **“No programs yet. Create your first program to get started.”**, and a **“Create Program”** button.
- **Priority:** High

### TC-015
- **Title:** Empty state still appears for Editor when no programs exist
- **Preconditions:** Logged in as **Editor**; system has **0** programs
- **Steps:**
  1. Navigate to `/programs`.
- **Expected result:** Same empty-state message and a visible path to create the first program (button presence per role rules).
- **Priority:** High

### TC-016
- **Title:** Description preview handles very long descriptions without breaking layout
- **Preconditions:** Logged in as **Admin**; program exists: `AI Foundations 2026` with a 500-character Description
- **Steps:**
  1. Navigate to `/programs`.
  2. Observe the description preview cell.
- **Expected result:** Preview is truncated/clamped per UI design; table layout remains aligned; no overflow covering action icons.
- **Priority:** Medium

### TC-017
- **Title:** Program Name with special characters displays correctly in the list
- **Preconditions:** Logged in as **Admin**; program exists: `Informatique & IA - Niveau 2`
- **Steps:**
  1. Navigate to `/programs`.
- **Expected result:** Name renders correctly and safely.
- **Priority:** Medium

### TC-018
- **Title:** Switching selection updates Semester Panel to the newly selected program
- **Preconditions:** Logged in as **Admin**; two programs exist with different semester sets: `Web Development 2026`, `Data Science 2026`
- **Steps:**
  1. Click `Web Development 2026` row and note Semester Panel content.
  2. Click `Data Science 2026` row.
- **Expected result:** Semester Panel updates to show semesters/holidays/breaks for `Data Science 2026` (no stale content).
- **Priority:** High

### TC-019
- **Title:** Row click still works after list re-fetch following a mutation
- **Preconditions:** Logged in as **Admin**; at least one successful mutation occurs (create/edit/delete)
- **Steps:**
  1. Perform a successful mutation (e.g., rename a program).
  2. After the list updates, click a program row.
- **Expected result:** Row selection and Semester Panel behavior still works after refresh.
- **Priority:** High

### TC-027
- **Title:** Program Name filter trims leading/trailing spaces in the query
- **Preconditions:** Admin on `/programs`; `Web Development 2026` exists
- **Steps:**
  1. Enter `  Web Development 2026  ` in **Program Name** filter.
- **Expected result:** `Web Development 2026` is returned (spaces do not prevent matching).
- **Priority:** Medium

### TC-028
- **Title:** Program Name filter handles special characters safely
- **Preconditions:** Admin on `/programs`; `Informatique & IA - Niveau 2` exists
- **Steps:**
  1. Enter `& IA -` in **Program Name** filter.
- **Expected result:** Matching program appears; UI remains stable.
- **Priority:** Low

### TC-029
- **Title:** After create/edit/delete, list re-fetch preserves active filters and updates results accordingly
- **Preconditions:** Admin on `/programs`; **Program Name** filter set to `Web`; results visible
- **Steps:**
  1. Create a program named `Web Security 2026` successfully.
  2. Observe the list after the automatic re-fetch.
  3. Delete one of the currently filtered `Web...` programs successfully.
- **Expected result:** Filters remain applied; after create, `Web Security 2026` appears in filtered results; after delete, the deleted program disappears—no manual refresh needed.
- **Priority:** High

---

## Traceability (AC → tests)

- **Display program list with key details:** TC-001, TC-002
- **Empty state when no programs exist:** TC-014, TC-015

---

## Ambiguities / gaps in the ACs

- **Filter UI details missing:** No spec for where filters live, exact control types, labels, debounce timing, case sensitivity, or match rules (contains vs starts-with).
- **Program Start Date field not defined elsewhere:** Source of “start date” (program-level attribute vs derived from first semester) and timezone handling are unspecified.
- **Role-based visibility for edit/delete icons:** Only “+ New Program” visibility is defined; edit/delete icon visibility by role is not specified.
- **No-results UX copy:** Empty state copy is defined for “no programs exist,” but not for “filters match zero.”
- **Course Builder destination:** “Navigate to Course Builder” has no route/title assertion.
- **Semester Panel empty state:** Not specified when a program has zero semesters/holidays/breaks.
- **List refresh UX:** Re-fetch is required after success, but loading indicators, latency expectations, and re-fetch failure behavior are not defined.
