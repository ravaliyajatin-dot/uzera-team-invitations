/**
 * Cucumber Hooks & World Setup
 *
 * World context properties available in every step:
 *   this.baseURL            – API base URL from .env
 *   this.client             – InvitationsClient instance (set in Background step)
 *   this.lastResponse       – last axios response object
 *   this.createdInvitations – array of invitations created in the scenario
 *   this.lastCreatedInvitation – most recently created invitation (single)
 *   this.authToken          – bearer token for current account
 *   this.currentPlan        – 'free' | 'premium'
 *
 * Lifecycle:
 *   BeforeAll  – start the mock server once for the whole suite
 *   Before     – reset server state + initialise World per scenario
 *   After      – log failures; light cleanup
 *   AfterAll   – stop the mock server
 */

require('dotenv').config();

const { Before, After, BeforeAll, AfterAll, setWorldConstructor, setDefaultTimeout } = require('@cucumber/cucumber');
const InvitationsClient = require('../pom/api/invitationsClient');

// ── Timeout ───────────────────────────────────────────────────────────────────
setDefaultTimeout(15_000);

// ── World ─────────────────────────────────────────────────────────────────────
class UzeraWorld {
  constructor({ attach, parameters }) {
    this.attach     = attach;
    this.parameters = parameters;

    // Populated by hooks / steps
    this.baseURL              = process.env.BASE_URL || 'http://localhost:3000';
    this.client               = null;
    this.lastResponse         = null;
    this.createdInvitations   = [];
    this.lastCreatedInvitation = null;
    this.authToken            = null;
    this.currentPlan          = null;
  }
}

setWorldConstructor(UzeraWorld);

// ── Mock server handle ────────────────────────────────────────────────────────
let mockServer = null;

BeforeAll(async function () {
  // Start the Express mock server in-process so no external process is needed
  const { server } = require('../mock-server/server');
  mockServer = server;
  console.log('\n[Hooks] Mock server started');
});

AfterAll(async function () {
  if (mockServer) {
    await new Promise((resolve) => mockServer.close(resolve));
    console.log('\n[Hooks] Mock server stopped');
  }
});

// ── Per-scenario setup ────────────────────────────────────────────────────────
Before(async function (scenario) {
  // Reset all in-memory server state so each scenario is fully isolated
  const adminClient = new InvitationsClient(
    process.env.BASE_URL || 'http://localhost:3000'
  );
  await adminClient.resetState();

  // Reset World state
  this.createdInvitations    = [];
  this.lastResponse          = null;
  this.lastCreatedInvitation = null;
  this.authToken             = null;
  this.currentPlan           = null;
  this.client                = null;
});

// ── Per-scenario teardown ─────────────────────────────────────────────────────
After(async function (scenario) {
  if (scenario.result.status === 'FAILED') {
    // Attach last response body to the Cucumber report for easier debugging
    if (this.lastResponse) {
      const details = JSON.stringify(
        {
          status: this.lastResponse.status,
          data:   this.lastResponse.data
        },
        null,
        2
      );
      await this.attach(`Last API Response:\n${details}`, 'text/plain');
    }
  }
});
