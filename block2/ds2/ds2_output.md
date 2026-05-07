# Test plan: Edit existing program details (final)

**Feature:** **Admin** or **Editor** opens **Edit Program** from the Programs row ✏️. The modal always shows **Program Name** (`TextInput`) and **Description** (`Textarea`). **AI Generation Config** is a **collapsible**, **optional** block: **Total Hours**, **Default Session Hours**, **Default Exam Hours**, **Target Audience**, **Focus Areas**, **Sync/Async Ratio** slider. Min/max for hours and slider meaning (e.g. 0–100% sync weight) remain **product-defined** where not specified below.

**Program Name:** required, max **100**, trimmed on submit, unique per **organization** **case-insensitive** among **active** (non-archived) programs. **Uniqueness is validated on Save only** (not while typing).

**Description:** optional, max **500**, empty by default.

**Validation:** Non-uniqueness rules (length, format, optional config) may run **debounced 500ms** after changes; **duplicate name is checked only when Save is submitted**.

**Save (edit):** disabled when **Program Name** is empty (after client rules).

**List:** after any **successful** create/edit/delete mutation, **re-fetch** the list so changes appear **without** manual page refresh.

**Modal close:** **X**, **Cancel**, click **outside**.

**Roles**

| Role | Access |
|------|--------|
| **Admin** | Full CRUD (create, edit, **delete**) |
| **Editor** | Create and **edit** only — **cannot delete** |
| **Viewer** | Read-only list |

**Archive rule:** Names of **archived** programs **may be reused** by an active program (uniqueness does **not** block reuse of an archived name).

---

## 1. Positive flows

| ID | Title | Preconditions | Steps | Expected result | Priority |
|----|--------|---------------|-------|-----------------|----------|
| TC-001 | Edit modal pre-populates **Program Name**, **Description**, and optional **AI Generation Config** | **Admin** on **Programs**; **Web Development 2026** has known values (e.g. **Description** `Full-stack cohort for 2026`; config e.g. **Total Hours** `120`, **Default Session Hours** `2`, **Default Exam Hours** `1`, **Target Audience** `Career switchers`, **Focus Areas** `React; Node`, slider mid-range) | 1. Click ✏️. 2. Expand **AI Generation Config** if needed. | All populated fields match server. Empty optional config stays empty. | High |
| TC-002 | Pre-population matches server after load | Fresh list load | 1. Open edit for **Web Development 2026**. | No stale data. | Medium |
| TC-003 | Save **Program Name** only — modal closes, list re-fetches | **Admin** | 1. Set **Program Name** to `Web Development 2026 - Updated`. 2. **Save**. | Modal closes; list re-fetches; new name visible. | High |
| TC-004 | **Editor** saves **Description**; list re-fetches | **Editor** | 1. Set **Description** to `Editor-updated description`. 2. **Save**. | Modal closes; re-fetch shows new text. | High |
| TC-005 | **Description**-only edit preserves **Program Name** and config | Non-empty config | 1. Change **Description** only. 2. **Save**. 3. Re-open. | **Program Name** unchanged; config unchanged. | High |
| TC-006 | Config-only edit preserves **Program Name** and **Description** | — | 1. Expand **AI Generation Config**. 2. Change **Total Hours** to `140`, move **Sync/Async Ratio**. 3. **Save**. 4. Re-open. | Name/description unchanged; config saved. | High |
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
| TC-016 | **Viewer** cannot edit | **Viewer** | 1. No working ✏️ / path. 2. Attempt API if exposed. | No edit; **403** or equivalent. | High |
| TC-017 | **Editor** cannot **delete** | **Editor**; program row visible | 1. Look for delete control on Programs UI. 2. Attempt delete API if discoverable. | **No** delete in UI **or** **403**; program remains after attempt. | High |
| TC-018 | **Admin** can delete (regression anchor) | **Admin** | 1. Use delete for a disposable test program. | Delete allowed per product; list re-fetches. | Medium |
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

---

## Traceability (original ACs)

| Acceptance criterion | Tests (≥2) |
|----------------------|------------|
| Open edit → pre-populated | TC-001, TC-002 |
| Name change → close + immediate list | TC-003, TC-004 |
| **Description**-only → **Program Name** unchanged | TC-005, TC-006 |

---

## Remaining ambiguities / gaps

1. **Default collapsed state** for **AI Generation Config** on edit is still unspecified (expand vs collapsed when opening modal).
2. **Numeric bounds** and **slider meaning** (0–100%, sync vs async) still need a short spec for TC-024.
3. **Unsaved-change guard** on **X** / backdrop (confirm vs silent discard) not specified.
4. **TC-027** setup depends on whether archiving frees the name in one step or requires data seeding—align with backend rules for “active vs archived” in uniqueness checks.
5. **Error UX** for **400/409** (field vs global) still unspecified.
