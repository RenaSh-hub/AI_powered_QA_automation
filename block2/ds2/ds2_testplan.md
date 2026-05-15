# Test plan: Edit existing program details (final)

**Ticket:** [DS-2](https://legionqaschool.atlassian.net/browse/DS-2) — *Edit existing program details*

**User story (from ticket):** As an admin user, I want to edit an existing program's details so that I can correct or update program information after creation.

### Acceptance criteria (from Jira)

```gherkin
Scenario: Open program for editing
  Given I am on the Programs page
  And a program "Web Development 2026" exists
  When I click the edit icon on "Web Development 2026"
  Then I see the edit form pre-populated with the program's current data

Scenario: Successfully edit a program name
  Given I am editing "Web Development 2026"
  When I change the Name to "Web Development 2026 - Updated"
  And I click Save
  Then the modal closes
  And the program list immediately shows "Web Development 2026 - Updated"

Scenario: Edit preserves unchanged fields
  Given I am editing a program
  When I only change the Description
  And I click Save
  Then the Name and other fields remain unchanged
```

---

**Automation scope (ds2N):** All scenarios below are executed **as an Admin user** (same account as create/edit/delete on Programs). No **Editor** or **Viewer** personas in this suite.

**Feature:** An **Admin** opens **Edit Program** from the Programs row ✏️. The modal always shows **Program Name** (`TextInput`) and **Description** (`Textarea`). **AI Generation Config** is a **collapsible**, **optional** block: **Total Program Hours**, **Default Session Hours**, **Default Exam Hours**, **Target Audience**, **Focus Areas**, **Sync/Async Ratio** slider. Min/max for hours and slider meaning (e.g. 0–100% sync weight) remain **product-defined** where not specified below.

**Program Name:** required, max **100**, trimmed on submit, unique per **organization** **case-insensitive** among **active** (non-archived) programs. **Uniqueness is validated on Save only** (not while typing).

**Description:** optional, max **500**, empty by default.

**Validation:** Non-uniqueness rules (length, format, optional config) may run **debounced 500ms** after changes; **duplicate name is checked only when Save is submitted**.

**Save (edit):** disabled when **Program Name** is empty (after client rules).

**List:** after any **successful** create/edit/delete mutation, **re-fetch** the list so changes appear **without** manual page refresh.

**Modal close:** **X**, **Cancel**, click **outside**.

**Archive rule:** Names of **archived** programs **may be reused** by an active program (uniqueness does **not** block reuse of an archived name).

---

## 1. Positive flows

| ID | Title | Preconditions | Steps | Expected result | Priority |
|----|--------|---------------|-------|-----------------|----------|
| TC-001 | Edit modal pre-populates **Program Name**, **Description**, and optional **AI Generation Config** | **Admin** logged in; **Programs**; **Web Development 2026** has known values (e.g. **Description** `Full-stack cohort for 2026`; config e.g. **Total Program Hours** `120`, **Default Session Hours** `2`, **Default Exam Hours** `1`, **Target Audience** `Career switchers`, **Focus Areas** `React; Node`, slider mid-range) | 1. Click ✏️. 2. Expand **AI Generation Config** if needed. | All populated fields match server. Empty optional config stays empty. | High |
| TC-002 | Pre-population matches server after load | Fresh list load | 1. Open edit for **Web Development 2026**. | No stale data. | Medium |
| TC-003 | Save **Program Name** only — modal closes, list re-fetches, other fields preserved | **Admin**; program has **Description** `Full-stack cohort for 2026` and non-empty config | 1. Set **Program Name** to `Web Development 2026 - Updated`. 2. **Save**. 3. Verify list updates **without** full page reload; new name visible. 4. Re-open edit modal. | Modal closes; list re-fetches immediately (no manual refresh); new name visible. On re-open: **Description** and **AI Generation Config** unchanged. | High |
| TC-004 | **Admin** saves **Description** only; list re-fetches | **Admin** on **Programs** | 1. Set **Description** to `Updated cohort description`. 2. **Save**. | Modal closes; re-fetch shows new text. | High |
| TC-005 | **Description**-only edit preserves **Program Name** and config | Non-empty config | 1. Change **Description** only. 2. **Save**. 3. Re-open. | **Program Name** unchanged; config unchanged. | High |
| TC-006 | Config-only edit preserves **Program Name** and **Description** | — | 1. Expand **AI Generation Config**. 2. Change **Total Program Hours** to `140`, move **Sync/Async Ratio**. 3. **Save**. 4. Re-open. | Name/description unchanged; config saved. | High |
| TC-007 | Clear **Description** saves | Had description | 1. Clear **Description**. 2. **Save**. | Re-fetch shows empty description. | Medium |
| TC-008 | Leave all **AI Generation Config** empty / unchanged on edit | Program has no config set | 1. Open edit; do not expand or leave fields blank. 2. Change **Program Name** slightly. 3. **Save**. | Success; optional config not required; no false errors. | High |
| TC-009 | Collapse/expand **AI Generation Config** does not drop unsaved edits | — | 1. Edit **Focus Areas**. 2. Collapse; expand. | Value retained. | Medium |
| TC-010 | **Reuse name of an archived program** succeeds | Program **Legacy Bootcamp 2024** is **archived**; active **Web Development 2026** exists | 1. Edit **Web Development 2026**. 2. Set **Program Name** to `Legacy Bootcamp 2024` (exact archived name, any allowed casing). 3. **Save**. | **Success** (archived name reusable). Modal closes; re-fetch shows new name. **No** duplicate error vs archived row. | High |
| TC-011 | Create/edit active name still blocked if another **active** program has case-insensitive match | Active **Data Science 2026** | 1. Edit **Web Development 2026**; set **Program Name** `DATA SCIENCE 2026`. 2. **Save**. | **400/409** on **Save**; error shown. | High |

---

## 2. Negative flows

| ID | Title | Preconditions | Steps | Expected result | Priority |
|----|--------|---------------|-------|-----------------|----------|
| TC-012 | **Save** disabled when **Program Name** empty | Modal open | 1. Clear **Program Name**. | **Save** disabled; no API. | High |
| TC-013 | Whitespace-only **Program Name** blocked after trim | — | 1. Enter `   `. 2. Attempt **Save** if enabled. | No successful update; modal remains. | High |
| TC-014 | Duplicate vs **active** program on **Save** only | Active duplicate target exists | 1. Type conflicting **Program Name** slowly. 2. Observe during typing (≥500ms idle). 3. **Save**. | **No** duplicate error **until Save**; on **Save**, **400/409** and message. | High |
| TC-015 | API failure on update | **500**/network | 1. Valid change. 2. **Save**. | Error shown; list not showing false success. | High |
| TC-018 | **Admin** can delete (regression anchor; optional in ds2N edit-only runs) | **Admin** | 1. Use delete for a disposable test program. | Delete allowed per product; list re-fetches. | Medium |
| TC-019 | Close **X** / **Cancel** / **outside** without **Save** discards edits | Dirty **Program Name** | 1. Change name to `Should Not Save`. 2. Close via **X**, reopen; repeat **Cancel**; repeat **outside**. | Name never `Should Not Save` after discard path. | High |

---

## 3. Edge cases

| ID | Title | Preconditions | Steps | Expected result | Priority |
|----|--------|---------------|-------|-----------------|----------|
| TC-020 | Debounced **500ms** validation for **non-uniqueness** rules | Fields with length/format validation | 1. Type rapidly in **Program Name** or **Description**. | No per-keystroke spam; after **500ms** idle, applicable validation runs. **Duplicate** not shown mid-typing. | High |
| TC-021 | **Program Name** trim on save | Padded value | 1. `  Web Development 2026  `. 2. **Save**. | Trimmed stored value; re-fetch OK. | Medium |
| TC-022 | **Program Name** **100** / **101** chars | — | 1. Save 100. 2. Try 101. | 100 OK; 101 blocked/error. | Medium |
| TC-023 | **Description** **500** / **501** chars | — | 1. Save 500. 2. Try 501. | 500 OK; 501 blocked/error. | Medium |
| TC-024 | Optional config: hours/slider at product min/max | If spec added later | 1. Set boundary values. 2. **Save**. | Matches rules; optional fields still not “required”. | Low |
| TC-025 | Special characters in name, description, **Target Audience**, **Focus Areas** | — | 1. Enter `A & B <tag> "quotes"`. 2. **Save**. | Persists; list/modal safe. | Medium |
| TC-026 | Case-only rename when no other **active** conflict | — | 1. `Web Development 2026` → `WEB DEVELOPMENT 2026`. 2. **Save**. | Success on **Save**; no false duplicate vs self. | High |
| TC-027 | Archived duplicate: two actives cannot share name; archived does not count | One active **Summer 2026**; archive another that was `Summer 2026` — adjust setup per data model | 1. Ensure only one **active** `Summer 2026` (case-insensitive). 2. Edit another program to same name; **Save**. | Blocked if second **active** would duplicate; **TC-010** still holds for **archived-only** collision. | Medium |
| TC-028 | Double-click **Save** | — | Double-click **Save**. | One logical update; one re-fetch. | Medium |
| TC-029 | Collapsed config on open: partial edit does not wipe config | Program has saved config | 1. Open edit (section collapsed). 2. Change only **Program Name**. 3. **Save**. | Config unchanged on server. | High |
| TC-030 | Session expiry on **Save** | — | Expire session; **Save**. | Auth error; no bogus UI update. | Low |
| TC-031 | **Admin** edits **Program Name** — modal closes, list updates immediately | **Admin**; program **Web Development 2026** exists with **Description** `Full-stack cohort for 2026` | 1. Click ✏️ on **Web Development 2026**. 2. Change **Program Name** to `Web Dev 2026 – Renamed`. 3. **Save**. 4. Verify list updates **without** full page reload. 5. Re-open edit modal. | Modal closes; list re-fetches immediately (no manual refresh); new name visible. On re-open: **Description** unchanged. | High |

---

## Traceability (original ACs)

| Acceptance criterion | Tests (≥2) |
|----------------------|------------|
| Open edit → pre-populated | TC-001, TC-002 |
| Name change → close + immediate list (no manual refresh) | TC-003, TC-031 |
| **Description**-only → **Program Name** unchanged | TC-004, TC-005, TC-006 |

**Out of ds2N (Admin-only) scope:** Role-matrix cases previously tracked as Viewer read-only edit denial and Editor delete denial are **not** part of this plan; cover them in a separate multi-role suite if needed.

---

## Remaining ambiguities / gaps

1. **Default collapsed state** for **AI Generation Config** on edit is still unspecified (expand vs collapsed when opening modal).
2. **Numeric bounds** and **slider meaning** (0–100%, sync vs async) still need a short spec for TC-024.
3. **Unsaved-change guard** on **X** / backdrop (confirm vs silent discard) not specified.
4. **TC-027** setup depends on whether archiving frees the name in one step or requires data seeding—align with backend rules for “active vs archived” in uniqueness checks.
5. **Error UX** for **400/409** (field vs global) still unspecified.

---

## Automated test coverage (verification)

Playwright MCP snapshot of `/login` confirms **Email**, **Password**, **Sign In** — aligned with Admin login in **`ds2N-edit-program.spec.ts`**.

| TC | `tests/ds2-edit-program.spec.ts` | `tests/ds2N-edit-program.spec.ts` |
|----|-----------------------------------|-----------------------------------|
| TC-001 | Yes | Yes |
| TC-002 | No | Yes |
| TC-003 | Partial (no reopen / no AI config check) | Yes (full per plan) |
| TC-004 | No | Yes (**Admin** only) |
| TC-005 | Yes | Yes |
| TC-006 | No | Partial (hours only; plan also asks **Sync/Async** slider) |
| TC-007 | Yes | Yes |
| TC-008 | No | Yes |
| TC-009 | Yes | Yes |
| TC-010, TC-027 | No (needs archive seed data) | No |
| TC-011 | No | Yes |
| TC-012 | Yes | Yes |
| TC-013 | No | Yes |
| TC-014 | No | Yes |
| TC-015, TC-030 | No (need route mock / session control) | No |
| TC-016, TC-017 | Retired from ds2N Admin-only plan | — |
| TC-018 | No (see `ds4-delete-program`) | No |
| TC-019 | Yes (X + Cancel; X uses fragile locator) | Cancel only |
| TC-020 | No | No (debounce hard to assert without hooks) |
| TC-021 | No | Yes |
| TC-022 | Yes | Yes |
| TC-023 | No | Yes |
| TC-024 | No | No (spec TBD) |
| TC-025 | Yes | Yes |
| TC-026 | Yes | Yes |
| TC-028 | No | No |
| TC-029 | No | Yes |
| TC-031 | No | Yes (**Admin** only) |

**Recommended improvements**

1. **Single source of truth:** Treat **`ds2N-edit-program.spec.ts`** as the DS-2 automation baseline; keep **`ds2-edit-program.spec.ts`** as a lighter smoke set or merge after deduplicating TCs.
2. **Plan vs UI:** Use **`Total Program Hours`** (textbox), not “Total Hours” / spinbutton, in docs and new tests.
3. **TC-005 / TC-006:** Extend **description-only** case to assert **AI config unchanged** when config is set; add **slider** step for TC-006 when product bounds exist.
4. **TC-019:** Replace X-button traversal with a stable **`dialog` → Close** (or `aria-label`) once agreed with UX; add **outside-click** dismiss if the app supports it.
5. **Multi-role regression:** If **Viewer** / **Editor** behaviour must be certified, add a **separate** test pack (not ds2N); TC-016 / TC-017 can be revived there with dedicated credentials.
