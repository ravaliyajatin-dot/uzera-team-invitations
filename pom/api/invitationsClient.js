/**
 * InvitationsClient  (POM – API Client)
 *
 * Wraps every API call for the Team Invitations feature.
 * Step definitions call methods on this class — they never
 * construct raw axios requests themselves.
 *
 * Usage:
 *   const client = new InvitationsClient(baseURL, token);
 *   const res    = await client.sendInvitation('user@example.com');
 */

const axios = require('axios');
const ENDPOINTS = require('./endpoints');

class InvitationsClient {
  /**
   * @param {string} baseURL  – e.g. 'http://localhost:3000'
   * @param {string} [token]  – Bearer token; omit to test unauthenticated paths
   */
  constructor(baseURL, token = null) {
    this.baseURL = baseURL;
    this.token   = token;

    // Axios instance shared across all calls
    this._http = axios.create({
      baseURL,
      validateStatus: () => true   // never throw on HTTP errors – let tests assert
    });
  }

  // ── Private helper ────────────────────────────────────────────────────────

  _headers(overrideToken) {
    const t = overrideToken !== undefined ? overrideToken : this.token;
    return t ? { Authorization: `Bearer ${t}` } : {};
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  /**
   * Login and obtain a bearer token bound to the given plan.
   * Stores the token on the instance for subsequent calls.
   *
   * @param {string} email
   * @param {'free'|'premium'} plan
   * @returns {import('axios').AxiosResponse}
   */
  async login(email, plan) {
    const res = await this._http.post(ENDPOINTS.AUTH.LOGIN, { email, plan });
    if (res.status === 200 && res.data.token) {
      this.token = res.data.token;
    }
    return res;
  }

  // ── Invitations ───────────────────────────────────────────────────────────

  /**
   * POST /api/team/invitations
   * @param {string} email
   * @param {string} [overrideToken]  – pass null to test unauthenticated
   */
  async sendInvitation(email, overrideToken) {
    return this._http.post(
      ENDPOINTS.INVITATIONS.BASE,
      { email },
      { headers: this._headers(overrideToken) }
    );
  }

  /**
   * POST /api/team/invitations  – with no body (missing email field test)
   */
  async sendInvitationNoBody(overrideToken) {
    return this._http.post(
      ENDPOINTS.INVITATIONS.BASE,
      {},
      { headers: this._headers(overrideToken) }
    );
  }

  /**
   * GET /api/team/invitations
   * @param {string} [overrideToken]  – pass null to test unauthenticated
   */
  async listInvitations(overrideToken) {
    return this._http.get(
      ENDPOINTS.INVITATIONS.BASE,
      { headers: this._headers(overrideToken) }
    );
  }

  /**
   * DELETE /api/team/invitations/:id
   * @param {string} id
   */
  async revokeInvitation(id) {
    return this._http.delete(
      ENDPOINTS.INVITATIONS.BY_ID(id),
      { headers: this._headers() }
    );
  }

  // ── Admin / Test-only ─────────────────────────────────────────────────────

  /**
   * Reset all server-side state between tests.
   */
  async resetState() {
    return this._http.post(ENDPOINTS.ADMIN.RESET);
  }

  /**
   * Change the plan of the currently authenticated token mid-test.
   * Used for plan-downgrade scenario.
   *
   * @param {'free'|'premium'} newPlan
   */
  async setPlan(newPlan) {
    return this._http.post(
      ENDPOINTS.ADMIN.SET_PLAN,
      { token: this.token, plan: newPlan }
    );
  }
}

module.exports = InvitationsClient;
