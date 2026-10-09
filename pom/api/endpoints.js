/**
 * API Endpoints Constants  (POM – Locator equivalent for API tests)
 *
 * All endpoint paths are defined here in one place.
 * If the API contract changes, only this file needs updating.
 */

const ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: '/api/auth/login'
  },

  // ── Team Invitations ──────────────────────────────────────────────────────
  INVITATIONS: {
    BASE: '/api/team/invitations',
    BY_ID: (id) => `/api/team/invitations/${id}`
  },

  // ── Admin / Test-only ─────────────────────────────────────────────────────
  ADMIN: {
    RESET:    '/api/admin/reset',
    SET_PLAN: '/api/admin/set-plan'
  }
};

module.exports = ENDPOINTS;
