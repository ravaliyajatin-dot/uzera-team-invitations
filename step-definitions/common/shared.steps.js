/**
 * Shared / Common Step Definitions
 *
 * Steps reused across multiple feature files:
 *   - Authentication (Background steps)
 *   - Generic response assertion steps
 *   - Admin helpers (reset, plan change)
 *
 * Feature-specific steps live in step-definitions/invitations/
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect }            = require('@playwright/test');
const InvitationsClient     = require('../../pom/api/invitationsClient');
const { TEST_USERS }        = require('../../test-data/users');

// ── Background / Auth ─────────────────────────────────────────────────────────

/**
 * Shared Background step used in every feature:
 *   Given I am logged in as a "free" plan user
 *   Given I am logged in as a "premium" plan user
 */
Given('I am logged in as a {string} plan user', async function (plan) {
  const user   = TEST_USERS[plan.toLowerCase()];
  this.client  = new InvitationsClient(this.baseURL);
  const res    = await this.client.login(user.email, user.plan);

  expect(res.status, `Login failed for ${plan} plan`).toBe(200);
  expect(res.data.token, 'Token missing in login response').toBeTruthy();

  // Store plan & token on World for use in other steps
  this.currentPlan  = plan.toLowerCase();
  this.authToken    = res.data.token;
});

// ── Generic Response Assertions ───────────────────────────────────────────────

Then('the request is rejected with status {int}', function (expectedStatus) {
  expect(
    this.lastResponse.status,
    `Expected HTTP ${expectedStatus}, got ${this.lastResponse.status}`
  ).toBe(expectedStatus);
});

Then('the error message contains {string}', function (fragment) {
  const body    = this.lastResponse.data;
  const message = (body.message || body.error || '').toLowerCase();
  expect(
    message,
    `Expected error message to contain "${fragment}", got: "${message}"`
  ).toContain(fragment.toLowerCase());
});

Then('the invitation is created with status {int}', function (expectedStatus) {
  expect(
    this.lastResponse.status,
    `Expected HTTP ${expectedStatus} on invitation creation, got ${this.lastResponse.status}`
  ).toBe(expectedStatus);

  const body = this.lastResponse.data;
  expect(body.id,        'Response missing invitation id').toBeTruthy();
  expect(body.email,     'Response missing email').toBeTruthy();
  expect(body.createdAt, 'Response missing createdAt').toBeTruthy();
});

Then('the invitation status should be {string}', function (expectedStatus) {
  const body = this.lastResponse.data;
  expect(
    body.status,
    `Expected invitation status "${expectedStatus}", got "${body.status}"`
  ).toBe(expectedStatus);
});

// ── Plan-change (admin helper) ────────────────────────────────────────────────

When('my plan is downgraded to {string}', async function (newPlan) {
  const res = await this.client.setPlan(newPlan);
  expect(res.status, `setPlan to "${newPlan}" failed`).toBe(200);
  this.currentPlan = newPlan;
});
