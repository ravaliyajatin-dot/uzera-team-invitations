/**
 * Mock Server for Uzera Team Invitations API
 *
 * Simulates plan-based invitation limits:
 *   - Free plan  : up to 2 active invitations
 *   - Premium plan: unlimited invitations
 *
 * Endpoints:
 *   POST   /api/team/invitations          – send an invitation
 *   GET    /api/team/invitations          – list invitations
 *   DELETE /api/team/invitations/:id      – revoke an invitation
 *   POST   /api/auth/login               – get a token (sets plan context)
 *   POST   /api/admin/reset              – test-only: reset all state
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// ─── In-memory store ────────────────────────────────────────────────────────
// Structure: { [token]: { plan: 'free'|'premium', invitations: [...] } }
const store = {};

// ─── Plan rules ─────────────────────────────────────────────────────────────
const PLAN_LIMITS = {
  free: 2,
  premium: Infinity
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getAccount(token) {
  return store[token] || null;
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const account = getAccount(token);
  if (!account) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing token' });
  }
  req.account = account;
  req.token = token;
  next();
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Body: { "email": "...", "plan": "free"|"premium" }
 * Returns a bearer token bound to the plan.
 */
app.post('/api/auth/login', (req, res) => {
  const { email, plan } = req.body;

  if (!email || !plan) {
    return res.status(400).json({ error: 'Bad Request', message: '"email" and "plan" are required' });
  }

  const validPlans = Object.keys(PLAN_LIMITS);
  if (!validPlans.includes(plan.toLowerCase())) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `"plan" must be one of: ${validPlans.join(', ')}`
    });
  }

  const token = uuidv4();
  store[token] = { email, plan: plan.toLowerCase(), invitations: [] };

  return res.status(200).json({ token, plan: plan.toLowerCase(), email });
});

/**
 * POST /api/team/invitations
 * Body: { "email": "user@example.com" }
 * Enforces plan-based limits.
 */
app.post('/api/team/invitations', authMiddleware, (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Bad Request', message: '"email" is required' });
  }

  // Simple email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(422).json({ error: 'Unprocessable Entity', message: 'Invalid email format' });
  }

  const { plan, invitations } = req.account;
  const limit = PLAN_LIMITS[plan];
  const activeCount = invitations.filter(i => i.status === 'pending').length;

  // Check plan limit
  if (activeCount >= limit) {
    return res.status(403).json({
      error: 'Forbidden',
      message: `Your ${plan} plan allows a maximum of ${limit === Infinity ? 'unlimited' : limit} team member invitation${limit === 1 ? '' : 's'}. Upgrade to invite more.`,
      plan,
      limit: limit === Infinity ? null : limit,
      currentCount: activeCount
    });
  }

  // Check duplicate pending invite
  const duplicate = invitations.find(i => i.email === email && i.status === 'pending');
  if (duplicate) {
    return res.status(409).json({
      error: 'Conflict',
      message: `An active invitation for ${email} already exists`,
      invitationId: duplicate.id
    });
  }

  const invitation = {
    id: uuidv4(),
    email,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  invitations.push(invitation);

  return res.status(201).json(invitation);
});

/**
 * GET /api/team/invitations
 * Returns all invitations for the authenticated account.
 */
app.get('/api/team/invitations', authMiddleware, (req, res) => {
  const { invitations, plan } = req.account;
  return res.status(200).json({
    plan,
    limit: PLAN_LIMITS[plan] === Infinity ? null : PLAN_LIMITS[plan],
    count: invitations.filter(i => i.status === 'pending').length,
    invitations
  });
});

/**
 * DELETE /api/team/invitations/:id
 * Revokes (soft-deletes) a pending invitation.
 */
app.delete('/api/team/invitations/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { invitations } = req.account;

  const invitation = invitations.find(i => i.id === id);

  if (!invitation) {
    return res.status(404).json({ error: 'Not Found', message: `Invitation ${id} not found` });
  }

  if (invitation.status !== 'pending') {
    return res.status(409).json({
      error: 'Conflict',
      message: `Cannot revoke an invitation with status "${invitation.status}"`
    });
  }

  invitation.status = 'revoked';
  invitation.revokedAt = new Date().toISOString();

  return res.status(200).json(invitation);
});

/**
 * POST /api/admin/reset
 * Test-only: clears ALL in-memory state.
 */
app.post('/api/admin/reset', (req, res) => {
  Object.keys(store).forEach(k => delete store[k]);
  return res.status(200).json({ message: 'State reset successfully' });
});

/**
 * POST /api/admin/set-plan
 * Test-only: change the plan of an existing token mid-test (plan-change scenario).
 */
app.post('/api/admin/set-plan', (req, res) => {
  const { token, plan } = req.body;
  if (!store[token]) {
    return res.status(404).json({ error: 'Not Found', message: 'Token not found' });
  }
  const validPlans = Object.keys(PLAN_LIMITS);
  if (!validPlans.includes(plan)) {
    return res.status(400).json({ error: 'Bad Request', message: `plan must be one of: ${validPlans.join(', ')}` });
  }
  store[token].plan = plan;
  return res.status(200).json({ token, plan });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.MOCK_PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`[Mock Server] Running on http://localhost:${PORT}`);
});

module.exports = { app, server, store };
