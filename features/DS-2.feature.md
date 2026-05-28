Feature: DS-2 — Edit existing program details

  As an admin user, I want to edit an existing program's details so that I can
  correct or update program information after creation.

  # Happy paths

  Scenario: Open program for editing
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Web Development 2026" exists with Description "Full-stack cohort for 2026"
    When I click the edit icon on "Web Development 2026"
    Then I see the "Edit Program" modal
    And the Program Name field shows "Web Development 2026"
    And the Description field shows "Full-stack cohort for 2026"

  Scenario: Successfully edit a program name
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Program Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Web Development 2026 - Updated" without a manual page refresh

  Scenario: Edit preserves unchanged fields when only Description is changed
    Given I am logged in as admin
    And I am editing "Web Development 2026" with Description "Full-stack cohort for 2026"
    When I change the Description to "Updated cohort description"
    And I leave the Program Name unchanged
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026"
    When I reopen the edit form for "Web Development 2026"
    Then the Program Name field shows "Web Development 2026"
    And the Description field shows "Updated cohort description"

  Scenario: Edit AI Generation Config only preserves Program Name and Description
    Given I am logged in as admin
    And I am editing "Web Development 2026" with Description "Full-stack cohort for 2026"
    When I expand the AI Generation Config section
    And I set Total Program Hours to "140"
    And I click Save
    Then the modal closes
    When I reopen the edit form for "Web Development 2026"
    Then the Program Name field shows "Web Development 2026"
    And the Description field shows "Full-stack cohort for 2026"
    And Total Program Hours shows "140"

  Scenario: Clear optional Description on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026" with Description "Full-stack cohort for 2026"
    When I clear the Description field
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026"
    When I reopen the edit form for "Web Development 2026"
    Then the Description field is empty

  Scenario: Program name trimmed on save
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Program Name to "  Web Development 2026 - Updated  "
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026 - Updated"

  Scenario: Case-only rename succeeds when no other active program conflicts
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    And no other active program has a case-insensitive match for "WEB DEVELOPMENT 2026"
    When I change the Program Name to "WEB DEVELOPMENT 2026"
    And I click Save
    Then the modal closes
    And the program list shows "WEB DEVELOPMENT 2026"

  # Negative

  Scenario: Save is disabled when Program Name is empty
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I clear the Program Name field
    Then the Save button is disabled

  Scenario: Program is not updated when Save button is disabled
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    And the Program Name field is empty
    And the Save button is disabled
    When I attempt to click Save
    Then the modal remains open
    And the program list still shows "Web Development 2026"

  Scenario: Whitespace-only Program Name is rejected after trim
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Program Name to "   "
    Then the Save button is disabled or the update is blocked on submit
    And the modal remains open
    And the program list still shows "Web Development 2026"

  Scenario: Duplicate active program name is rejected on Save
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    And an active program "Data Science 2026" already exists
    When I change the Program Name to "DATA SCIENCE 2026"
    And I click Save
    Then an error is displayed
    And the modal remains open
    And the program list still shows "Web Development 2026"

  Scenario: Duplicate name error is not shown while typing
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    And an active program "Data Science 2026" already exists
    When I change the Program Name to "DATA SCIENCE 2026"
    And I wait without clicking Save
    Then no duplicate-name error is shown before Save is clicked

  Scenario: Closing the modal without saving discards edits
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Program Name to "Should Not Save"
    And I close the "Edit Program" modal without saving
    Then the program list still shows "Web Development 2026"
    And the program list does not show "Should Not Save"

  Scenario: Cancel without saving discards edits
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Description to "Unsaved change"
    And I click Cancel
    Then the modal closes
    When I reopen the edit form for "Web Development 2026"
    Then the Description field shows "Full-stack cohort for 2026"

  Scenario: Program is not updated without clicking Save
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Program Name to "Web Development 2026 - Updated"
    And I do not click Save
    Then the modal remains open
    And the program list still shows "Web Development 2026"

  # Edge cases

  Scenario: Program Name at maximum length of 100 characters is accepted
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Program Name to a 100-character valid name
    And I click Save
    Then the modal closes
    And the program list shows the 100-character name

  Scenario: Program Name exceeding 100 characters is rejected
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Program Name to a 101-character value
    And I attempt to click Save
    Then the update is blocked or an error is shown
    And the program list still shows "Web Development 2026"

  Scenario: Description at maximum length of 500 characters is accepted
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Description to a 500-character value
    And I click Save
    Then the modal closes
    And the saved Description is 500 characters long

  Scenario: Description exceeding 500 characters is rejected
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Description to a 501-character value
    And I attempt to click Save
    Then the update is blocked or an error is shown

  Scenario: Special characters in Program Name and Description are accepted
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Program Name to "Informatique & IA - Niveau 2"
    And I change the Description to "A & B <tag> \"quotes\""
    And I click Save
    Then the modal closes
    And the program list shows "Informatique & IA - Niveau 2"

  Scenario: Collapsed AI Generation Config does not wipe saved config on name-only edit
    Given I am logged in as admin
    And I am editing "Web Development 2026" with Total Program Hours set to "120"
    And the AI Generation Config section is collapsed
    When I change the Program Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal closes
    When I reopen the edit form for "Web Development 2026 - Updated"
    And I expand the AI Generation Config section
    Then Total Program Hours shows "120"

  Scenario: Collapse and expand AI Generation Config retains unsaved field edits
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I expand the AI Generation Config section
    And I set Focus Areas to "React; Node"
    And I collapse the AI Generation Config section
    And I expand the AI Generation Config section again
    Then Focus Areas still shows "React; Node"

  Scenario: Rapid double-click on Save sends only one update
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Program Name to "Web Development 2026 - Updated"
    And I double-click Save
    Then the modal closes
    And exactly one program named "Web Development 2026 - Updated" appears in the program list

  Scenario: Program list re-fetches immediately after successful edit
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Web Development 2026" exists
    When I click the edit icon on "Web Development 2026"
    And I change the Program Name to "Web Dev 2026 – Renamed"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Web Dev 2026 – Renamed" without a manual page refresh

# Ambiguities and gaps in DS-2 acceptance criteria:
#
# - Role coverage: ACs specify "admin" only. Editor create/edit and Viewer read-only
#   access to the edit icon and Edit Program modal are not defined in DS-2.
# - Field constraints: Max length (Program Name 100, Description 500), trimming rules,
#   and case-insensitive duplicate-name handling are not specified in DS-2 ACs.
# - AI Generation Config: The collapsible optional block (Total Program Hours, Default
#   Session Hours, Default Exam Hours, Target Audience, Focus Areas, Sync/Async Ratio)
#   is not mentioned in DS-2 ACs but appears on the edit form in the app.
# - Duplicate validation timing: ACs do not state whether uniqueness is checked on Save
#   only or while typing; related defects (DS-11) note missing visible duplicate errors.
# - Archived program names: Whether an active program may reuse an archived program's
#   name is not specified in DS-2 ACs.
# - Modal dismiss: ACs do not describe closing via X, Cancel, or click-outside without
#   saving, or whether an unsaved-changes confirmation is required.
# - Validation UX: ACs do not specify inline error messages vs disabled Save for empty
#   name, or field-level vs global error display for duplicate names and API failures.
# - List refresh: AC for successful edit says the list immediately shows the new name
#   but does not explicitly require server re-fetch without manual refresh (see DS-9).
# - Numeric bounds and slider semantics for AI Generation Config are unspecified.
# - Double-click Save idempotency: Not in DS-2 ACs but noted in linked defects and
#   QA findings — included as edge case.
