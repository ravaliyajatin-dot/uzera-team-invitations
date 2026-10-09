@free
Feature: Free Plan Team Invitations
  As a Free plan customer
  I can invite up to 2 team members
  So that I can collaborate within my plan limits

  Background:
    Given I am logged in as a "free" plan user

  @smoke
  Scenario: Successfully send first invitation on Free plan
    When I invite "member1@example.com"
    Then the invitation is created with status 201
    And the invitation status should be "pending"

  Scenario: Successfully send second invitation on Free plan
    When I invite "member1@example.com"
    And I invite "member2@example.com"
    Then the total pending invitations count is 2

  @boundary
  Scenario: Free plan blocks third invitation after limit is reached
    Given I have already sent 2 invitations
    When I invite "member3@example.com"
    Then the request is rejected with status 403
    And the error message contains "free plan"

  @boundary
  Scenario: Free plan allows invite after revoking one from the limit
    Given I have already sent 2 invitations
    When I revoke the first invitation
    And I invite "member3@example.com"
    Then the invitation is created with status 201

  Scenario: Free plan invitation list shows correct count and limit
    Given I have already sent 2 invitations
    When I list all invitations
    Then the response shows limit 2 and count 2
