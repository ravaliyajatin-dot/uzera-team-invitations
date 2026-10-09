@premium
Feature: Premium Plan Team Invitations
  As a Premium plan customer
  I can invite unlimited team members
  So that my entire team can collaborate without restrictions

  Background:
    Given I am logged in as a "premium" plan user

  @smoke
  Scenario: Premium plan can send an invitation
    When I invite "member1@example.com"
    Then the invitation is created with status 201
    And the invitation status should be "pending"

  Scenario: Premium plan can send more than 2 invitations
    When I invite the following members:
      | email                  |
      | alpha@example.com      |
      | beta@example.com       |
      | gamma@example.com      |
    Then the total pending invitations count is 3

  @boundary
  Scenario: Premium plan shows null limit in invitation list
    When I invite "member1@example.com"
    And I list all invitations
    Then the response shows no limit enforced

  Scenario: Premium plan can revoke and re-invite without restriction
    Given I have already sent 2 invitations
    When I revoke the first invitation
    And I invite "new@example.com"
    And I invite "another@example.com"
    And I invite "yetanother@example.com"
    Then the total pending invitations count is 4
