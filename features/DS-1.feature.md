Feature: DS-1 — Create new academic program

  As an admin user, I want to create a new academic program so that I can begin
  designing its curriculum structure.

  # Happy paths

  Scenario: Navigate to program creation form
    Given I am logged in as admin
    When I navigate to the Programs page
    And I click "+ New Program"
    Then I see the program creation form with fields: Program Name, Description

  Scenario: Successfully create a program
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"

  Scenario: Validation prevents empty program name
    Given I am on the program creation form
    When I leave the Program Name field empty
    Then the Create button is disabled

  Scenario: Create a program with an empty description
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Cloud Engineering 2026"
    And I leave the Description field empty
    And I click Create
    Then the modal closes
    And the program list shows "Cloud Engineering 2026"

  # Negative

  Scenario: Program is not created when Create button is disabled
    Given I am logged in as admin
    And I am on the program creation form
    And the Program Name field is empty
    And the Create button is disabled
    When I attempt to click Create
    Then the modal remains open
    And no new program is added to the program list

  Scenario: Program is not created without submitting the form
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I do not click Create
    Then the modal remains open
    And the program list does not show "Web Development 2026"

  Scenario: Closing the modal without saving does not create a program
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Data Science 2026"
    And I fill in Description with "Machine learning fundamentals"
    And I close the "New Program" modal without saving
    Then the program list does not show "Data Science 2026"

  # Edge cases

  Scenario: Program name with leading and trailing whitespace is handled on submit
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "  Web Development 2026  "
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"

  Scenario: Program name with only whitespace is treated as empty
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "   "
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled

  Scenario: Program name with special characters is accepted
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Informatique & IA - Niveau 2"
    And I fill in Description with "Bilingual STEM program"
    And I click Create
    Then the modal closes
    And the program list shows "Informatique & IA - Niveau 2"

  Scenario: Rapid double-click on Create creates only one program
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Mobile Development 2026"
    And I fill in Description with "iOS and Android development"
    And I double-click Create
    Then the modal closes
    And exactly one program named "Mobile Development 2026" appears in the program list

  Scenario: Program list updates immediately after successful creation
    Given I am logged in as admin
    And I am on the Programs page
    When I click "+ New Program"
    And I fill in Program Name with "Cybersecurity 2026"
    And I fill in Description with "Network and application security"
    And I click Create
    Then the modal closes
    And the program list immediately shows "Cybersecurity 2026" without a manual page refresh

# Ambiguities and gaps in DS-1 acceptance criteria:
#
# - Role coverage: ACs specify "admin" only. Editor/Viewer access to "+ New Program"
#   and the creation form is not defined in DS-1.
# - Field constraints: Max length for Program Name (100) and Description (500),
#   trimming rules, and duplicate-name handling are not specified in DS-1.
# - Optional fields: ACs do not state whether Description is required; empty
#   Description behavior is assumed testable but not documented in the ticket.
# - Validation UX: AC only states Create is disabled for empty name; it does not
#   specify whether an inline error message should appear.
# - AI Generation Config: The collapsible optional config block visible on create
#   in the app is not mentioned in DS-1 ACs (see Confluence: Program Setup &
#   Management > Overview).
# - List refresh: AC for successful create says the program appears in the list
#   but does not explicitly require immediate server re-fetch without manual refresh.
# - Cancel/close behavior: No AC describes dismissing the modal without saving.
# - Double-click idempotency: Not in DS-1 ACs but noted in ticket comment
#   (BUG-001 / TC-E-009) and linked defects DS-17, SS-26 — included as edge case.
# - Modal dismiss timing: Linked defect DS-16 notes modal may exceed ~2 s to
#   dismiss after Create; no performance SLA in DS-1 ACs.
