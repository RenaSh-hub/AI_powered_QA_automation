# Test plan: Delete program with confirmation (final)

**Feature:** On the **Program Setup** / **Programs** page, only **Admin** may delete a program via the row **🗑** control. **Editor** and **Viewer** **cannot** delete programs (no working delete path in normal UX; API must not allow unauthorized delete). A **native browser confirmation** appears: **Delete program “[program name]”? All its semesters and courses will be removed. This cannot be undone.** **OK** runs the delete **API**; on success, the program is **removed from the list immediately**. **Cancel** aborts with **no** delete.

**Roles (delete)**

| Role | Delete |
|------|--------|
| **Admin** | Allowed (with confirmation) |
| **Editor** | **Not allowed** |
| **Viewer** | **Not allowed** |

---

## 1. Positive flows

| ID | Title | Preconditions | Steps | Expected result | Priority |
|----|--------|---------------|-------|-----------------|----------|
| TC-001 | **Admin** sees native confirm with exact **Test Program** wording | **Admin** on Programs; **Test Program** exists | 1. Locate **Test Program**. 2. Click 🗑. | Native dialog; message includes **Test Program** and the semesters/courses / cannot be undone text. | High |
| TC-002 | Confirming delete removes **Test Program** from the list at once | **Admin**; delete API succeeds | 1. 🗑 on **Test Program** → **OK**. | API delete runs; **Test Program** disappears **immediately**; other rows unchanged. | High |
| TC-003 | Cancel leaves **Test Program** in the list | **Admin** | 1. 🗑 on **Test Program** → **Cancel**. | No successful delete; **Test Program** still listed. | High |
| TC-004 | Cancel leaves **Web Development 2026** in the list | **Admin**; program exists | 1. 🗑 on **Web Development 2026** → **Cancel**. | Program still in list. | High |
| TC-005 | Deleting one program does not remove others | **Test Program** and **Web Development 2026** exist | 1. Delete **Test Program** → **OK**. | Only **Test Program** removed; **Web Development 2026** remains. | High |
| TC-006 | List updates after delete without full page reload | **Admin**; ≥3 programs | 1. Delete one program → **OK**. | Count/order reflect removal **immediately** without manual refresh. | Medium |

---

## 2. Negative flows

| ID | Title | Preconditions | Steps | Expected result | Priority |
|----|--------|---------------|-------|-----------------|----------|
| TC-007 | **Editor** has no usable delete control on program rows | **Editor**; **Test Program** exists | 1. Open Programs. 2. Inspect **Test Program** row and page chrome. | **No** 🗑 (or delete is disabled/hidden). **Test Program** cannot be removed via UI. | High |
| TC-008 | **Editor** delete API is rejected | **Editor** session; program id for **Test Program** | 1. Call delete API with **Editor** credentials. | **403** / **401** / **405** (per product); **Test Program** still exists after list refresh. | High |
| TC-009 | **Viewer** has no delete control | **Viewer**; **Test Program** exists | 1. Open Programs. 2. Confirm no 🗑 / delete affordance. | No delete in UI; program remains. | High |
| TC-010 | **Viewer** delete API is rejected | **Viewer** session; valid program id | 1. Invoke delete API. | Denied; program remains. | High |
| TC-011 | **Cancel** does not trigger delete API | **Admin**; network monitored | 1. 🗑 → **Cancel**. | No completed delete request for that flow. | High |
| TC-012 | Failed delete does not remove row | **Admin**; delete returns **500** or network error | 1. 🗑 → **OK** under failure. | Error surfaced; **Test Program** **stays** in list. | High |
| TC-013 | Row not removed before confirmed success | **Admin**; slow delete | 1. 🗑 → **OK** with delayed response. | No premature disappearance; or explicit loading—no “gone” if request fails. | Medium |
| TC-014 | Rapid **OK** does not corrupt state | **Admin** | 1. 🗑 → **OK** twice if possible. | One successful delete at most; list consistent. | Medium |

---

## 3. Edge cases

| ID | Title | Preconditions | Steps | Expected result | Priority |
|----|--------|---------------|-------|-----------------|----------|
| TC-015 | Confirm text includes **special-character** program name | Program **Test Program `<2026>` & "Beta"** exists | 1. 🗑. | Dialog shows correct name; **OK** deletes that program only. | Medium |
| TC-016 | Long **Program Name** (e.g. **100** chars) in dialog | Program at max name length | 1. 🗑 → read dialog → **OK**. | Correct program deleted; list updates. | Medium |
| TC-017 | Delete **last** program | Only **Test Program** | 1. 🗑 → **OK**. | Empty list or empty state; no crash. | Medium |
| TC-018 | Dismiss dialog (e.g. **Esc**) same as **Cancel** | **Admin** | 1. 🗑. 2. Dismiss without **OK**. | No delete; program remains. | Low |
| TC-019 | Other session still sees program after **Cancel** | Two sessions | 1. Session A: 🗑 → **Cancel**. 2. Session B: view list. | **Test Program** still present. | Low |
| TC-020 | Session expired on **OK** | **Admin** | 1. Invalidate session. 2. 🗑 → **OK**. | Auth error; program not removed. | Low |
| TC-021 | Program with semesters/courses | **Test Program** has children in DB | 1. 🗑 → **OK**. | Warning text accurate; on success, row removed per backend rules. | High |
| TC-022 | Two rows—delete one by row identity | Distinct programs, same or different names per product | 1. 🗑 on one row → **OK**. | Exactly one program removed. | Low |

---

## Traceability (acceptance criteria)

| Acceptance criterion | Test IDs (≥2) |
|----------------------|----------------|
| **Test Program**: confirm → **OK** → removed from list | TC-001, TC-002 |
| Confirm → **Cancel** → program still in list | TC-003, TC-004 |
| **Editor** / **Viewer** **cannot** delete | TC-007, TC-008, TC-009, TC-010 |

---

## Ambiguities and gaps in the ACs

1. **List consistency:** “Removed immediately” vs optimistic UI vs server re-fetch after success is not specified.
2. **Native dialog only:** If implementation switches to a custom modal, update TC-001/TC-018.
3. **Exact quoting** in the native dialog may vary by browser/OS.
4. **Failed delete** and **loading** UX are not in the ACs (covered by TC-012/TC-013).
5. **Hard delete vs archive** and reuse of archived names are not defined in these ACs.
6. **Org-level vs global admin** not specified.
