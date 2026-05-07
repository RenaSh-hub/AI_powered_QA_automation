# DS2 — User input (prompts)

## Task: folder and artifact names (this request)

Create `block2` folder. Inside it create `ds2` folder. Store the user’s prompt(s) in `ds2_input.md` and the assistant’s result in `ds2_output.md`.

---

## Original task: test plan for “Edit existing program details”

**Role:** Senior QA engineer.

**Feature:** As an admin user, edit an existing program’s details to correct or update information after creation.

**Flow:** Click ✏️ on program row → “Edit Program” modal with pre-populated data → user modifies fields → “Save” → API update → on success: modal closes, list refreshes with updated data; on failure: error shown.

**Client-side validation**

- Rule 1: Program name empty → Create/Save disabled; no explicit error message.
- Rule 2: Program name whitespace-only → on submit, name trimmed; empty check blocks submission; modal stays open, no submission.

**Server-side validation**

- Duplicate program name (within organization) → 400/409 → error displayed.

**Acceptance criteria (Gherkin-style)**

1. Open program for editing: on Programs page, program “Web Development 2026” exists; click edit → form pre-populated with current data.
2. Successfully edit program name: change name to “Web Development 2026 - Updated”, Save → modal closes; list immediately shows new name.
3. Edit preserves unchanged fields: only change Description, Save → Name and other fields remain unchanged.

**Test plan requirements**

- Cover every AC with at least two test cases.
- Add edge cases: boundaries, empty inputs, special characters, duplicates, max-length.
- Add negative tests (what should NOT happen).
- Per test case: ID (TC-001…), Title (expected behavior), Preconditions, numbered Steps, Expected result, Priority (High/Medium/Low).
- Group: Positive flows, Negative flows, Edge cases.
- Markdown output; real field names and values; end with ambiguities/gaps in ACs.

---

## Update 1 — Field rules, roles, list refresh, duplicates

1. **Program Name:** string, required, max **100** characters, unique per organization (**case-insensitive**).
2. **Description:** string, max **500**, empty by default, **not** required.
3. Create/Save disabled when Program Name is empty.
4. Program Name trimmed on submit; whitespace-only names rejected.
5. **Roles:** Admin — full CRUD; Editor — create and edit; Viewer — read-only list.
6. **List refresh:** After any successful mutation (create, edit, delete), list **must** update immediately without manual refresh; **re-fetch from server** after each successful mutation.
7. Duplicate name check: **not** case-sensitive (case-insensitive uniqueness).

---

## Update 2 — Validation debounce, form layout, modal behavior

1. Validation runs after every mutation, **debounced at 500ms** (interpreted later: uniqueness **only on Save**; debounce applies to other validation).
2. **Form layout:** Create and edit modals: always visible — Program Name (TextInput), Description (Textarea). Collapsible **“AI Generation Config”:** Total Hours, Default Session Hours, Default Exam Hours, Target Audience, Focus Areas, Sync/Async Ratio slider.
3. Edit modal close: **X**, **Cancel**, or **click outside**.
4. **Save** (edit) disabled when Program Name is empty.
5. Modal has collapsible **AI Generation Config** section.

---

## Update 3 — Clarifications

1. **AI Generation Config:** **Not required** (optional). Min/max hours, slider semantics (0–100%, etc.), default collapsed on edit — initially unspecified.
2. **Duplicate check timing:** Uniqueness validated **on Save only** (not while typing).
3. **Editor** cannot **Delete**.
4. **Archived** program names **can be reused** (uniqueness does not block reusing an archived program’s name).

---

## Update 4 — Artifact storage (this file)

Store all of the above as input in `ds2_input.md`; store the final test plan in `ds2_output.md`.
