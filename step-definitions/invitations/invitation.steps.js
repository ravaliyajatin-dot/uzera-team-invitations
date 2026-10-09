/**
 * Invitation-specific Step Definitions
 *
 * Covers all steps from:
 *   - free_plan.feature
 *   - premium_plan.feature
 *   - edge_cases.feature
 *
 * Uses InvitationsClient (POM) for every API call.
 * World context (this.*) is set up in support/hooks.js
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect }            = require('@playwright/test');
const { MEMBER_EMAILS, INVALID_INPUTS } = require('../../test-data/users');

// ── Send Invitation ───────────────────────────────────────────────────────────

When('I invite {string}', async function (email) {
  this.lastResponse = await this.client.sendInvitation(email);

  // Track created invitations for cleanup / later steps
  if (this.lastResponse.status === 201) {
    this.createdInvitations.push(this.lastResponse.data);
  }
});

When('I invite the following members:', async function (dataTable) {
  const rows = dataTable.hashes();   // [{ email: '...' }, ...]
  for (const row of rows) {
    const res = await this.client.sendInvitation(row.email);
    expect(res.status, `Failed to invite ${row.email}`).toBe(201);
    this.createdInvitations.push(res.data);
  }
  // lastResponse = last call in the loop
  this.lastResponse = await this.client.listInvitations();
});

When('I send an invitation with no email field', async function () {
  this.lastResponse = await this.client.sendInvitationNoBody();
});

When('I send an invitation without a token', async function () {
  this.lastResponse = await this.client.sendInvitation(
    MEMBER_EMAILS.member1,
    null   // override token → no Authorization header
  );
});

When('I list invitations without a token', async function () {
  this.lastResponse = await this.client.listInvitations(null);
});

// ── Pre-condition: already sent N invitations ─────────────────────────────────

Given('I have already sent {int} invitations', async function (count) {
  const pool = Object.values(MEMBER_EMAILS);
  for (let i = 0; i < count; i++) {
    const res = await this.client.sendInvitation(pool[i]);
    expect(res.status, `Pre-condition: invite #${i + 1} failed`).toBe(201);
    this.createdInvitations.push(res.data);
  }
});

Given('I invite {string} successfully', async function (email) {
  const res = await this.client.sendInvitation(email);
  expect(res.status, `Pre-condition: invite ${email} failed`).toBe(201);
  this.createdInvitations.push(res.data);
  this.lastCreatedInvitation = res.data;
});

// ── Revoke ────────────────────────────────────────────────────────────────────

When('I revoke the first invitation', async function () {
  const first       = this.createdInvitations[0];
  this.lastResponse = await this.client.revokeInvitation(first.id);
  expect(this.lastResponse.status, 'Revoke failed in pre-condition').toBe(200);
  // Mark revoked locally so count stays consistent
  first.status = 'revoked';
});

When('I revoke invitation with id {string}', async function (id) {
  this.lastResponse = await this.client.revokeInvitation(id);
});

Given('I revoke that invitation', async function () {
  const inv         = this.lastCreatedInvitation;
  this.lastResponse = await this.client.revokeInvitation(inv.id);
  expect(this.lastResponse.status, 'Pre-condition revoke failed').toBe(200);
  inv.status = 'revoked';
});

When('I revoke that invitation again', async function () {
  const inv         = this.lastCreatedInvitation;
  this.lastResponse = await this.client.revokeInvitation(inv.id);
});

// ── List Invitations ──────────────────────────────────────────────────────────

When('I list all invitations', async function () {
  this.lastResponse = await this.client.listInvitations();
});

// ── Assertions ────────────────────────────────────────────────────────────────

Then('the total pending invitations count is {int}', async function (expectedCount) {
  const res = await this.client.listInvitations();
  expect(res.status).toBe(200);
  expect(
    res.data.count,
    `Expected ${expectedCount} pending invitations, got ${res.data.count}`
  ).toBe(expectedCount);
});

Then('the response shows limit {int} and count {int}', function (expectedLimit, expectedCount) {
  const body = this.lastResponse.data;
  expect(
    body.limit,
    `Expected limit ${expectedLimit}, got ${body.limit}`
  ).toBe(expectedLimit);
  expect(
    body.count,
    `Expected count ${expectedCount}, got ${body.count}`
  ).toBe(expectedCount);
});

Then('the response shows no limit enforced', function () {
  const body = this.lastResponse.data;
  expect(
    body.limit,
    'Premium plan should return null limit'
  ).toBeNull();
});
