jest.mock('obsidian', () => ({
  Plugin: class {},
}));

import { ApiValidateResponse, SubscriptionStatus } from '../Model/Api/ValidateResponse';

function build(status: string, expiresAt: string | null = '2030-01-01T00:00:00Z'): ApiValidateResponse {
  return new ApiValidateResponse({
    data: {
      subscription: {
        status,
        expiresAt: expiresAt as unknown as string,
      },
    },
    message: 'ok',
  });
}

describe('ApiValidateResponse.parseStatus', () => {
  it.each([
    ['active', SubscriptionStatus.ACTIVE],
    ['canceled', SubscriptionStatus.CANCELED],
    ['incomplete', SubscriptionStatus.INCOMPLETE],
    ['incomplete_expired', SubscriptionStatus.INCOMPLETE_EXPIRED],
    ['past_due', SubscriptionStatus.PAST_DUE],
    ['paused', SubscriptionStatus.PAUSED],
    ['trialing', SubscriptionStatus.TRIALING],
    ['unpaid', SubscriptionStatus.UNPAID],
  ])('recognises known Stripe status %s', (raw, expected) => {
    const r = build(raw);
    expect(r.status).toBe(expected);
    expect(r.rawStatus).toBe(raw);
  });

  it('normalises mixed-case input to the matching enum value', () => {
    const r = build('Active');
    expect(r.status).toBe(SubscriptionStatus.ACTIVE);
    expect(r.rawStatus).toBe('Active');
  });

  it('returns UNKNOWN for an unrecognised status and preserves rawStatus', () => {
    const r = build('something_new');
    expect(r.status).toBe(SubscriptionStatus.UNKNOWN);
    expect(r.rawStatus).toBe('something_new');
  });

  it('returns UNKNOWN for an empty string', () => {
    const r = build('');
    expect(r.status).toBe(SubscriptionStatus.UNKNOWN);
    expect(r.rawStatus).toBe('');
  });

  it('returns UNKNOWN when the input is the literal "unknown" string', () => {
    // Defensive: the API shouldn't return this, but if it does we don't want
    // an UNKNOWN sentinel to be silently treated as a "real" recognised status.
    const r = build('unknown');
    expect(r.status).toBe(SubscriptionStatus.UNKNOWN);
    expect(r.rawStatus).toBe('unknown');
  });
});

describe('ApiValidateResponse.isSubscriptionActive', () => {
  it('returns true only for ACTIVE', () => {
    expect(build('active').isSubscriptionActive()).toBe(true);
  });

  it.each([
    'canceled',
    'past_due',
    'paused',
    'trialing', // trial is not the same as active per current logic
    'unpaid',
    'incomplete',
    'incomplete_expired',
    'gibberish',
    '',
  ])('returns false for %s', (status) => {
    expect(build(status).isSubscriptionActive()).toBe(false);
  });
});

describe('ApiValidateResponse.expiresAt', () => {
  it('parses an ISO date when present', () => {
    const r = build('active', '2030-06-15T12:00:00Z');
    expect(r.expiresAt).toBeInstanceOf(Date);
    expect(r.expiresAt?.toISOString()).toBe('2030-06-15T12:00:00.000Z');
  });

  it('is null when expiresAt is empty', () => {
    const r = build('active', '');
    expect(r.expiresAt).toBeNull();
  });
});
