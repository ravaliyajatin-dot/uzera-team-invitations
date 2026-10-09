# Part 1 – Test Approach: Plan-Based Team Invitations

## Feature Overview

Uzera restricts team member invitations by subscription plan:

| Plan    | Invite Limit  |
|---------|---------------|
| Free    | Up to 2       |
| Premium | Unlimited     |

---

## 1. Testing Strategy

I organised the approach by **risk area**, from highest to lowest business impact.

---

## 2. Functional Test Areas

### 2.1 Plan Limit Enforcement (Highest Risk)

These are the core business rules. Any defect here directly harms the product.

| # | Test Case | Expected Result | Automate? |
|---|-----------|----------------|-----------|
| F-01 | Free plan sends 1st invite | 201 Created, status=pending | ✅ Automated |
| F-02 | Free plan sends 2nd invite | 201 Created | ✅ Automated |
| F-03 | Free plan sends 3rd invite (at limit) | 403 Forbidden, meaningful error | ✅ Automated |
| F-04 | Free plan revokes 1 invite, then sends a new one | 201 Created (slot freed) | ✅ Automated |
| F-05 | Premium plan sends 1st invite | 201 Created | ✅ Automated |
| F-06 | Premium plan sends > 2 invites | All succeed (no limit) | ✅ Automated |
| F-07 | Invitation list shows correct count and limit per plan | 200, count/limit match | ✅ Automated |
| F-08 | Premium plan list shows null limit | 200, limit=null | ✅ Automated |

### 2.2 Input Validation

| # | Test Case | Expected Result | Automate? |
|---|-----------|----------------|-----------|
| V-01 | Missing email field in POST body | 400 Bad Request | ✅ Automated |
| V-02 | Malformed email format | 422 Unprocessable Entity | ✅ Automated |
| V-03 | Duplicate pending invite for same email | 409 Conflict | ✅ Automated |

### 2.3 Authentication & Authorisation

| # | Test Case | Expected Result | Automate? |
|---|-----------|----------------|-----------|
| A-01 | POST without token | 401 Unauthorized | ✅ Automated |
| A-02 | GET without token | 401 Unauthorized | ✅ Automated |
| A-03 | DELETE without token | 401 Unauthorized | ✅ Automated |
| A-04 | Token from User A used for User B's invites | 403 / 404 (data isolation) | ✅ Automated |

### 2.4 Revocation (DELETE)

| # | Test Case | Expected Result | Automate? |
|---|-----------|----------------|-----------|
| R-01 | Revoke a valid pending invite | 200, status=revoked | ✅ Automated |
| R-02 | Revoke a non-existent invite ID | 404 Not Found | ✅ Automated |
| R-03 | Revoke an already-revoked invite | 409 Conflict | ✅ Automated |

---

## 3. Boundary & Edge Cases

| # | Test Case | Expected Result | Automate? |
|---|-----------|----------------|-----------|
| B-01 | Free plan: send exactly 2 invites (at boundary) | Both succeed | ✅ Automated |
| B-02 | Free plan: send 3rd invite (one past boundary) | 403 Forbidden | ✅ Automated |
| B-03 | Plan downgrade Premium → Free with 2 existing invites | New invite blocked (403) | ✅ Automated |
| B-04 | Plan upgrade Free → Premium with 2 existing invites | New invite succeeds | ✅ Automated |

---

## 4. Hard-to-Automate Scenarios & Approach

### 4.1 Concurrency (Race Condition on Free Limit)

**Risk:** Two simultaneous POST requests from a Free plan user, both reading `count=1`, both proceeding, resulting in 3 invitations instead of 2.

**Approach:**
- **Not automated reliably** in this suite. Race conditions require load tooling (e.g., k6, Artillery) or atomic server-side enforcement (database-level locking / Redis).
- In this project the mock server processes requests synchronously (Node.js single-threaded event loop), so no race condition exists here — but a production SQL or distributed backend must use a transaction or compare-and-swap.
- **Manual test note:** Run two concurrent requests via Postman Runner or k6 against the real backend and assert exactly one succeeds with 201 and the other with 403.

### 4.2 Time-Based Invite Expiry

**Risk:** If invitations expire (e.g., after 7 days), the count should decrease and new invites become possible again.

**Assumption:** The current spec does not mention expiry. I am assuming invitations do NOT expire automatically unless the product team confirms otherwise.

**Question to raise:** *"Do pending invitations expire? If yes, what is the TTL and should expired invites free up quota slots?"*

**If expiry is confirmed:**
- Unit-test the expiry logic in isolation with mocked clocks.
- For integration, use a short TTL (e.g., 5 seconds) in test config and `setTimeout` to wait it out — fragile, so keep it as a manual check in CI.

### 4.3 Plan Change Mid-Session

**Risk:** A user sends 2 invitations on Premium, then is downgraded to Free. Can they now send a 3rd?

**Approach:** Automated via `POST /api/admin/set-plan` test-only endpoint (see `edge_cases.feature @plan-change`). This is a synthetic helper acceptable in a test environment. For production, trigger the plan change via billing webhook / admin API.

### 4.4 Email Delivery Verification

**Risk:** The invite email may not actually be sent even if the API returns 201.

**Approach:** Out of scope for API-level tests. Manually verify using a test inbox tool (e.g., Mailhog, Mailtrap) or a dedicated email integration test. Not automated here.

---

## 5. Non-Functional Concerns

| Area | Check | Automate? |
|------|-------|-----------|
| **Performance** | POST /api/team/invitations responds within 500 ms under normal load | Manual / k6 |
| **Security** | Token from one account cannot access another account's invitations | ✅ Automated (A-04) |
| **Security** | SQL injection / XSS in email field is sanitised | Manual / DAST scan |
| **Idempotency** | Sending the same invite twice returns 409, not 500 | ✅ Automated (V-03) |
| **Error format** | All error responses include `error` and `message` fields (consistent schema) | ✅ Automated (assertions on body) |

---

## 6. Manual-Only Checks & Reasons

| Check | Why Manual |
|-------|-----------|
| UI invite flow (if applicable) | Requires visual browser interaction; Playwright UI tests would be added separately |
| Email delivery | Needs real SMTP integration; mock does not send email |
| Concurrency / race conditions | Requires load tooling outside this framework |
| Plan upgrade/downgrade via billing UI | Third-party payment system; hard to automate end-to-end |
| Accessibility of invite UI | Needs screen reader / axe scan |

---

## 7. Assumptions Made

1. **Only Free and Premium plans exist** — no Trial, Pro, or Enterprise tiers.
2. **"Pending" invitations count toward the limit** — accepted/declined invitations do not.
3. **Revoked invitations free up a slot** immediately.
4. **Invitations do not expire** (no TTL defined in the spec).
5. **One invitation per email per account** — a second invite to the same email while one is pending returns 409.
6. **The DELETE endpoint revokes (soft-delete)**, it does not permanently remove the record.
7. **Authentication is token-based (Bearer)** — the token encodes the plan. Plan changes require an admin API call.
8. **The API is stateless per token** — each token represents one customer account.

---

## 8. Questions for the Product Team

1. Do pending invitations expire? If yes, what is the TTL?
2. Does a declined or accepted invitation still count toward the Free plan quota?
3. When a Free plan user upgrades to Premium, are they unblocked immediately?
4. When a Premium user is downgraded to Free with > 2 pending invites, are excess invites auto-revoked or just blocked from adding more?
5. Is there a rate limit on how many invite requests can be sent per minute (spam prevention)?
6. Can an owner re-invite the same email after it was revoked?
