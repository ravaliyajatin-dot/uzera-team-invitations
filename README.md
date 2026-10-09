# Uzera – Plan-Based Team Invitations
## Automated Test Suite

**Framework:** Playwright + JavaScript + Cucumber (BDD)  
**Author:** QA Automation Engineer Assessment Submission  
**Total Scenarios:** 17 | **Total Steps:** 74 | **Status:** ✅ All Passing

---



## 1. Project Overview

This repository contains the automated test suite for the **Uzera plan-based team invitations** feature.

The feature restricts how many team members a customer can invite based on their subscription plan:

| Plan    | Team Member Invites |
|---------|---------------------|
| Free    | Up to 2 members     |
| Premium | Unlimited           |

Since the Uzera application is not provided, a **lightweight Express mock server** is included that simulates the full API contract. The mock server starts and stops automatically within the test process — no manual setup required.

---

## 2. Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 18.x | Runtime |
| Cucumber (`@cucumber/cucumber`) | 10.3.2 | BDD test runner & Gherkin parser |
| Playwright (`@playwright/test`) | 1.44.0 | Assertion library |
| axios | 1.6.8 | HTTP client for API calls |
| Express | 4.18.2 | Mock API server |
| chai | 4.4.1 | Additional assertions |
| dotenv | 16.4.5 | Environment configuration |
| uuid | 9.0.1 | Unique ID generation in mock |

---

## 3. Project Structure

```
uzera-team-invitations/
│
├── features/                          # Gherkin feature files
│   └── invitations/
│       ├── free_plan.feature          # Free plan limit scenarios (5)
│       ├── premium_plan.feature       # Premium unlimited scenarios (4)
│       └── edge_cases.feature         # Validation, auth, edge cases (8)
│
├── step-definitions/                  # Step implementations
│   ├── common/
│   │   └── shared.steps.js            # Reusable steps (auth, assertions, plan-change)
│   └── invitations/
│       └── invitation.steps.js        # Invitation-specific steps
│
├── pom/                               # Page Object Model (API layer)
│   └── api/
│       ├── endpoints.js               # All API path constants (single source of truth)
│       └── invitationsClient.js       # API client – wraps all HTTP calls
│
├── support/
│   └── hooks.js                       # World setup, Before/After/BeforeAll/AfterAll hooks
│
├── test-data/
│   └── users.js                       # Centralised test users, emails, invalid inputs
│
├── mock-server/
│   └── server.js                      # Express mock API server (in-process)
│
├── docs/
│   └── test-approach.md               # Part 1 – Full test strategy document
│
├── reports/                           # Generated HTML & JSON reports
├── .env                               # Environment config (BASE_URL, MOCK_PORT)
├── cucumber.config.js                 # Cucumber runner configuration
└── package.json
```

---

## 4. Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | >= 18.x | [nodejs.org](https://nodejs.org) |
| npm | >= 9.x | Bundled with Node.js |

Verify your installation:

```bash
node --version
npm --version
```

---

## 5. Setup & Installation

### Step 1 — Navigate to the project folder

```bash
cd "D:\QA Practice\uzera-team-invitations"
```

> ⚠️ **Important:** All commands must be run from inside the `uzera-team-invitations` folder, not from the parent `QA Practice` folder.

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Verify environment config

The `.env` file is pre-configured for local runs. No changes needed:

```
BASE_URL=http://localhost:3000
MOCK_PORT=3000
```

> ✅ The mock server starts **automatically** inside the test process. You do **not** need to run it separately in another terminal.

---

## 6. Running the Tests

### Run all 17 scenarios

```bash
npm test
```

### Run by subscription plan

```bash
npm run test:free         # Free plan scenarios only    (5 scenarios)
npm run test:premium      # Premium plan scenarios only (4 scenarios)
npm run test:edge         # Edge case scenarios only    (8 scenarios)
```

### Run by test type tag

```bash
npx cucumber-js --config cucumber.config.js --tags "@smoke"       # Smoke tests (2 scenarios)
npx cucumber-js --config cucumber.config.js --tags "@boundary"    # Boundary tests (4 scenarios)
npx cucumber-js --config cucumber.config.js --tags "@validation"  # Input validation (3 scenarios)
npx cucumber-js --config cucumber.config.js --tags "@auth"        # Auth tests (2 scenarios)
```

> ⚠️ **PowerShell users:** Always wrap tags in double quotes — `"@smoke"` — as PowerShell treats `@` as a variable prefix.

### Generate HTML report

```bash
npm run test:report
```

Report is saved to `reports/cucumber-report.html`. Open it in any browser for a full visual breakdown of results.

---

## 7. Test Scenarios Summary

| Feature File | Scenarios | Tags Used |
|---|---|---|
| `free_plan.feature` | 5 | `@free` `@smoke` `@boundary` |
| `premium_plan.feature` | 4 | `@premium` `@smoke` `@boundary` |
| `edge_cases.feature` | 8 | `@edge` `@validation` `@auth` `@cleanup` `@plan-change` |
| **Total** | **17** | |

### What is tested

| Area | Scenarios |
|---|---|
| Free plan — 1st and 2nd invite succeed | ✅ |
| Free plan — 3rd invite blocked (403) | ✅ |
| Free plan — revoke frees up a slot | ✅ |
| Free plan — correct limit and count in list | ✅ |
| Premium plan — unlimited invites | ✅ |
| Premium plan — null limit returned in list | ✅ |
| Missing email field → 400 | ✅ |
| Invalid email format → 422 | ✅ |
| Duplicate pending invite → 409 | ✅ |
| Unauthenticated request → 401 | ✅ |
| Revoke non-existent invite → 404 | ✅ |
| Revoke already-revoked invite → 409 | ✅ |
| Plan downgrade blocks further invites | ✅ |

---

## 8. Architecture Decisions

This framework follows a **layered architecture** so that each file has one clear responsibility. Changing one layer does not break others.

```
Feature File  →  Step Definitions  →  POM (API Client)  →  Mock Server
   (What)            (How)              (Where / Who)        (Fake API)
```

---

### 8.1 API Locators — `pom/api/endpoints.js`

In UI automation, locators (CSS selectors, XPaths) are stored in POM files so they are not scattered across tests. The same principle is applied here for API paths.

**All API endpoint paths are defined in one single file:**

```
pom/api/endpoints.js
```

```js
ENDPOINTS.AUTH.LOGIN              → '/api/auth/login'
ENDPOINTS.INVITATIONS.BASE        → '/api/team/invitations'
ENDPOINTS.INVITATIONS.BY_ID(id)   → '/api/team/invitations/:id'
ENDPOINTS.ADMIN.RESET             → '/api/admin/reset'
```

**Why this matters:**  
If the API path changes (e.g. `/api/v2/team/invitations`), only **this one file** needs updating. No test file or step definition needs to change.

---

### 8.2 API Client (POM Layer) — `pom/api/invitationsClient.js`

This file is the **Page Object Model equivalent for the API layer**.

In UI automation, a Page Object wraps all interactions with a page so step definitions never touch the browser directly. Here, `invitationsClient.js` wraps all HTTP calls so step definitions never touch axios directly.

```
Step Definition  →  invitationsClient.sendInvitation()  →  POST /api/team/invitations
Step Definition  →  invitationsClient.listInvitations()  →  GET  /api/team/invitations
Step Definition  →  invitationsClient.revokeInvitation() →  DELETE /api/team/invitations/:id
```

**Key design choice — `validateStatus: () => true`:**  
axios is configured to never throw on HTTP errors. This means every response (200, 201, 400, 401, 403, 404, 409, 422) is returned to the test for explicit assertion. Tests assert meaningfully on status codes and response bodies — not just "no exception thrown".

**Methods available:**

| Method | HTTP Call |
|---|---|
| `login(email, plan)` | `POST /api/auth/login` |
| `sendInvitation(email)` | `POST /api/team/invitations` |
| `sendInvitationNoBody()` | `POST /api/team/invitations` (no body) |
| `listInvitations()` | `GET /api/team/invitations` |
| `revokeInvitation(id)` | `DELETE /api/team/invitations/:id` |
| `resetState()` | `POST /api/admin/reset` |
| `setPlan(newPlan)` | `POST /api/admin/set-plan` |

---

### 8.3 Common Step Definitions — `step-definitions/common/shared.steps.js`

Steps that are **reused across multiple feature files** are defined here once and shared everywhere.

**Without shared steps (bad — duplication):**
```
free_plan steps    → define "Given I am logged in as a free plan user"
premium_plan steps → define "Given I am logged in as a free plan user"  ← duplicate
edge_cases steps   → define "Given I am logged in as a free plan user"  ← duplicate
```

**With shared steps (good — single definition):**
```
shared.steps.js    → define "Given I am logged in as a {string} plan user"  ← once
free_plan uses it  ✅
premium_plan uses it ✅
edge_cases uses it  ✅
```

**Steps defined in `shared.steps.js`:**

| Step | Used In |
|---|---|
| `Given I am logged in as a {string} plan user` | All 3 feature files (Background) |
| `Then the request is rejected with status {int}` | All 3 feature files |
| `Then the error message contains {string}` | All 3 feature files |
| `Then the invitation is created with status {int}` | free_plan, premium_plan |
| `Then the invitation status should be {string}` | free_plan, premium_plan |
| `When my plan is downgraded to {string}` | edge_cases |

---

### 8.4 Test Data Management — `test-data/users.js`

All test data is centralised in one file. **No hardcoded values in step definitions or feature files.**

```js
TEST_USERS.free    → { email: 'free.owner@uzera-test.com',    plan: 'free'    }
TEST_USERS.premium → { email: 'premium.owner@uzera-test.com', plan: 'premium' }

MEMBER_EMAILS.member1 → 'member1@uzera-test.com'
MEMBER_EMAILS.member2 → 'member2@uzera-test.com'
// ... up to member5, plus named extras
```

**Why this matters:**  
If test emails change (e.g. to match a real environment), only `test-data/users.js` needs updating. No step definition file changes needed.

---

### 8.5 Hooks & Test Execution Priority — `support/hooks.js`

The `hooks.js` file manages the **full lifecycle** of the test suite:

| Hook | When It Runs | What It Does |
|---|---|---|
| `BeforeAll` | Once before all scenarios | Starts the Express mock server in-process |
| `Before` | Before every scenario | Resets server state + clears World variables |
| `After` | After every scenario | On failure: attaches last API response to HTML report |
| `AfterAll` | Once after all scenarios | Stops the mock server cleanly |

**World Object (`UzeraWorld`)** — shared context across all steps in one scenario:

```js
this.baseURL               // API base URL from .env
this.client                // InvitationsClient instance
this.lastResponse          // Last axios response (status + body)
this.createdInvitations    // Array of invitations created in this scenario
this.lastCreatedInvitation // Most recently created invitation
this.authToken             // Bearer token for current account
this.currentPlan           // 'free' | 'premium'
```

**Test execution priority via tags:**

```bash
# Run most critical tests first (smoke)
npx cucumber-js --config cucumber.config.js --tags "@smoke"

# Then boundary (core business rules)
npx cucumber-js --config cucumber.config.js --tags "@boundary"

# Then full suite
npm test
```

---

### 8.6 Mock Server (in-process) — `mock-server/server.js`

The Express mock server starts inside the Cucumber `BeforeAll` hook and stops in `AfterAll`. No separate terminal is needed. State is fully in-memory and reset before every scenario via `POST /api/admin/reset`, ensuring **complete test isolation**.

---

### 8.7 BDD with Cucumber — Feature Files

Gherkin feature files serve as **living documentation** readable by non-technical stakeholders (product owners, business analysts). Each scenario maps directly to a business rule.

```gherkin
# Business rule written in plain English — no code knowledge needed
Given I am logged in as a "free" plan user
And I have already sent 2 invitations
When I invite "member3@example.com"
Then the request is rejected with status 403
And the error message contains "free plan"
```

---

### 8.8 Playwright Assertions

`@playwright/test`'s `expect()` provides descriptive failure messages, making CI failures easy to diagnose:

```js
// On failure, message clearly states what was expected vs actual:
// Expected: 403   Received: 201
expect(res.status, `Expected HTTP 403, got ${res.status}`).toBe(403);
```

---

## 9. Hard-to-Automate Scenarios

| Scenario | Approach Taken |
|---|---|
| **Concurrency / race conditions** | Not automated in this suite. Requires load tooling (k6, Artillery). The mock server is single-threaded so no race occurs locally. The real backend must use DB-level transactions or compare-and-swap to prevent overshooting the limit. |
| **Invite expiry (time-based TTL)** | Not in scope — the spec does not define expiry. Assumption documented below. If confirmed, unit-test the expiry logic with mocked clocks. |
| **Plan change mid-session** | Automated via `POST /api/admin/set-plan` test-only endpoint. See `@plan-change` tag in `edge_cases.feature`. |
| **Email delivery verification** | Not automated. Verify manually with Mailhog or Mailtrap against a real backend. |

---

## 10. Assumptions

1. Only **Free** and **Premium** plans exist — no Trial, Pro, or Enterprise tiers.
2. Only **pending** invitations count toward the Free plan limit. Accepted or declined invitations do not.
3. Revoking a pending invitation **frees up a slot immediately**.
4. Invitations **do not expire** — no TTL is defined in the spec.
5. Sending a second invite to the same email (while one is pending) returns **409 Conflict**.
6. `DELETE` is a **soft-revoke** — records are kept with `status: "revoked"`, not permanently deleted.
7. Authentication is **Bearer token** based. Each token represents one customer account.

> Full test strategy, questions raised to the product team, and non-functional concerns are documented in [`docs/test-approach.md`](docs/test-approach.md).

---

## 11. Troubleshooting

| Problem | Solution |
|---|---|
| `npm error ENOENT: no such file or directory, package.json` | You are in the wrong folder. Run `cd "D:\QA Practice\uzera-team-invitations"` first. |
| `Cannot find module 'express'` | Run `npm install` |
| Steps show as **Undefined** | Always use `--config cucumber.config.js` flag, or use `npm test` which includes it automatically. |
| `Port 3000 already in use` | Update `MOCK_PORT` in `.env` to another port (e.g. `3001`) and update `BASE_URL` to match. |
| PowerShell tag error (`$smoke cannot be retrieved`) | Wrap tags in double quotes: `--tags "@smoke"` |
| Tests timeout | Increase `setDefaultTimeout` value in `support/hooks.js` (default: 15000ms) |
| HTML report not generated | Ensure `reports/` folder exists. Create it with: `mkdir reports` |
