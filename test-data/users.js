/**
 * Test Data – Users & Plans
 *
 * Centralised test data for all scenarios.
 * Using fixed emails per plan keeps scenarios readable and deterministic.
 * Each test resets server state in Before hook, so emails can be reused safely.
 */

const TEST_USERS = {
  free: {
    email: 'free.owner@uzera-test.com',
    plan:  'free'
  },
  premium: {
    email: 'premium.owner@uzera-test.com',
    plan:  'premium'
  }
};

/**
 * Generate a pool of unique member emails for invitation tests.
 * Indexed so feature files can refer to "member1", "member2" etc.
 */
const MEMBER_EMAILS = {
  member1: 'member1@uzera-test.com',
  member2: 'member2@uzera-test.com',
  member3: 'member3@uzera-test.com',
  member4: 'member4@uzera-test.com',
  member5: 'member5@uzera-test.com',
  alpha:   'alpha@example.com',
  beta:    'beta@example.com',
  gamma:   'gamma@example.com',
  new:     'new@example.com',
  another: 'another@example.com',
  yet:     'yetanother@example.com',
  extra:   'extra@example.com',
  dup:     'duplicate@example.com',
  revoke:  'revoke@example.com'
};

/**
 * Invalid / edge-case inputs
 */
const INVALID_INPUTS = {
  badEmail:  'not-a-valid-email',
  noAt:      'missingatdomain.com',
  emptyStr:  ''
};

module.exports = { TEST_USERS, MEMBER_EMAILS, INVALID_INPUTS };
