@edge
Feature: Team Invitation Edge Cases
  As a developer
  I want to ensure the invitation API handles edge cases gracefully
  So that data integrity and security are maintained

  Background:
    Given I am logged in as a "free" plan user

  @validation
  Scenario: Sending invitation with missing email returns 400
    When I send an invitation with no email field
    Then the request is rejected with status 400
    And the error message contains "email"

  @validation
  Scenario: Sending invitation with invalid email format returns 422
    When I invite "not-a-valid-email"
    Then the request is rejected with status 422
    And the error message contains "Invalid email"

  @validation
  Scenario: Duplicate pending invitation returns 409
    Given I invite "duplicate@example.com" successfully
    When I invite "duplicate@example.com"
    Then the request is rejected with status 409
    And the error message contains "already exists"

  @auth
  Scenario: Unauthenticated request to send invitation returns 401
    When I send an invitation without a token
    Then the request is rejected with status 401

  @auth
  Scenario: Unauthenticated request to list invitations returns 401
    When I list invitations without a token
    Then the request is rejected with status 401

  @cleanup
  Scenario: Revoking a non-existent invitation returns 404
    When I revoke invitation with id "non-existent-id-123"
    Then the request is rejected with status 404

  @cleanup
  Scenario: Revoking an already-revoked invitation returns 409
    Given I invite "revoke@example.com" successfully
    And I revoke that invitation
    When I revoke that invitation again
    Then the request is rejected with status 409

  @plan-change
  Scenario: Downgrade from Premium to Free blocks further invites above limit
    Given I am logged in as a "premium" plan user
    And I have already sent 2 invitations
    When my plan is downgraded to "free"
    And I invite "extra@example.com"
    Then the request is rejected with status 403
    And the error message contains "free plan"
