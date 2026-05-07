# Test plan: Program name validation and duplicate prevention

**Scope:** Program creation form validation for **Program Name** and **Description**, including server-side enforcement and user-visible error handling.

---

## 1. Positive flows

### TC-001
- **Title:** Program is created when name contains allowed special characters
- **Preconditions:** Admin is on **Create Program** form; user can create programs in the organization
- **Steps:**
  1. Enter **Program Name** = `Informatique & IA - Niveau 2`.
  2. Enter **Description** = `Evening track for working professionals.`
  3. Click **Create**.
- **Expected result:** Program is created successfully and appears in the program list.
- **Priority:** High

### TC-002
- **Title:** Program is created when Program Name length is exactly 100 characters
- **Preconditions:** Admin is on **Create Program** form
- **Steps:**
  1. Enter a **Program Name** with exactly **100 characters** (e.g., `AAAAAAAAAA` repeated 10 times).
  2. Leave **Description** empty.
  3. Click **Create**.
- **Expected result:** Program is created successfully; name is saved without truncation.
- **Priority:** Medium

### TC-003
- **Title:** Program is created when Description length is exactly 500 characters
- **Preconditions:** Admin is on **Create Program** form
- **Steps:**
  1. Enter **Program Name** = `Web Development 2027`.
  2. Enter a **Description** with exactly **500 characters**.
  3. Click **Create**.
- **Expected result:** Program is created successfully; full description is saved.
- **Priority:** Medium

---

## 2. Negative flows

### TC-004
- **Title:** Whitespace-only Program Name is trimmed and blocks submission
- **Preconditions:** Admin is on **Create Program** form
- **Steps:**
  1. Enter **Program Name** = `   `.
  2. Click **Create**.
- **Expected result:** Form is not submitted; name is treated as empty after trim; no program created.
- **Priority:** High

### TC-005
- **Title:** Duplicate Program Name in the same organization is rejected with a server error
- **Preconditions:** Admin is on **Create Program** form; program `Web Development 2026` already exists in the organization
- **Steps:**
  1. Enter **Program Name** = `Web Development 2026`.
  2. Enter **Description** = `Duplicate attempt`.
  3. Click **Create**.
- **Expected result:** Server returns **400 or 409**; user sees an error indicating the name already exists; no new program created.
- **Priority:** High

### TC-006
- **Title:** Program Name exceeding 100 characters is rejected with an error
- **Preconditions:** Admin is on **Create Program** form
- **Steps:**
  1. Enter a **Program Name** with **101 characters**.
  2. Click **Create**.
- **Expected result:** Server returns **400**; user sees an error; program is not created.
- **Priority:** High

### TC-007
- **Title:** Description exceeding 500 characters is rejected with an error
- **Preconditions:** Admin is on **Create Program** form
- **Steps:**
  1. Enter **Program Name** = `Data Science 2026`.
  2. Enter a **Description** with **501 characters**.
  3. Click **Create**.
- **Expected result:** Server returns **400**; user sees an error; program is not created.
- **Priority:** High

### TC-008
- **Title:** Program must not appear in list when server rejects creation
- **Preconditions:** Admin is on **Create Program** form
- **Steps:**
  1. Trigger a rejected case (e.g., **101-character Program Name**).
  2. Click **Create**.
  3. Check the program list after the error.
- **Expected result:** No ?phantom? program row is added; user does not see a success state.
- **Priority:** High

---

## 3. Edge cases

### TC-009
- **Title:** Leading/trailing spaces are trimmed and still enforce duplicate prevention
- **Preconditions:** Program `Web Development 2026` exists in the organization
- **Steps:**
  1. Enter **Program Name** = `  Web Development 2026  `.
  2. Click **Create**.
- **Expected result:** Name is trimmed; server rejects as duplicate with **400/409**; error shown.
- **Priority:** High

### TC-010
- **Title:** Program Name supports accented characters without corruption
- **Preconditions:** Admin is on **Create Program** form
- **Steps:**
  1. Enter **Program Name** = `Économie ? Analyse Avancée`.
  2. Click **Create**.
- **Expected result:** Creation succeeds; list displays accents correctly.
- **Priority:** Medium

### TC-011
- **Title:** Program Name containing quotes/brackets is displayed safely
- **Preconditions:** Admin is on **Create Program** form
- **Steps:**
  1. Enter **Program Name** = `AI \"Foundations\" (Level 1)`.
  2. Click **Create**.
- **Expected result:** Creation succeeds; the name renders correctly; no broken UI or script execution.
- **Priority:** Medium

### TC-012
- **Title:** Duplicate prevention holds under concurrency
- **Preconditions:** Two admin sessions; no existing program named `Cloud Engineering 2026`
- **Steps:**
  1. In both sessions, set **Program Name** = `Cloud Engineering 2026`.
  2. Click **Create** in session A and then quickly in session B.
- **Expected result:** One create succeeds; the other fails with **400/409**; only one program exists afterward.
- **Priority:** Medium

---

## Coverage mapping (AC ? tests)

- **Reject whitespace-only name:** TC-004
- **Accept special characters:** TC-001 (also TC-011)
- **Reject duplicate name:** TC-005 (also TC-009, TC-012)

---

## Ambiguities / gaps

1. **Duplicate matching rules:** Not specified whether duplicates are case-insensitive, whether internal multiple spaces normalize (e.g., `Web  Development 2026`), or whether Unicode normalization applies.
2. **Client-side behavior:** AC says ?form is not submitted? for whitespace; unclear whether **Create** is disabled when trimmed-empty or only blocked on submit.
3. **Error UX:** Error placement (inline under **Program Name**/**Description** vs toast/banner) and whether focus moves to the invalid field is not specified.
4. **Org scope:** Behavior when same name exists in a different organization is not covered.
5. **Archived programs:** Not specified whether archived names can be reused or still count as duplicates.
