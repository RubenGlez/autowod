import { describe, it, expect } from 'vitest';
import { gymToday } from '../services/date';
import { isLoginPage } from '../services/auth';

const iso = (d: Date) => d.toISOString();

describe('gymToday', () => {
  it('uses the Madrid date after Madrid midnight while UTC is still yesterday (winter)', () => {
    // 00:54 in Madrid on Nov 18 — the run that booked from Nov 17.
    expect(iso(gymToday(new Date('2026-11-17T23:54:00Z')))).toBe('2026-11-18T00:00:00.000Z');
  });

  it('uses the Madrid date in summer (UTC+2)', () => {
    expect(iso(gymToday(new Date('2026-07-01T22:30:00Z')))).toBe('2026-07-02T00:00:00.000Z');
  });

  it('matches the UTC date during the day', () => {
    expect(iso(gymToday(new Date('2026-11-17T21:30:00Z')))).toBe('2026-11-17T00:00:00.000Z');
  });
});

describe('isLoginPage', () => {
  it('flags the login page, with or without a gym subdomain', () => {
    expect(isLoginPage('https://wodbuster.com/account/login.aspx')).toBe(true);
    expect(isLoginPage('https://osadia.wodbuster.com/Account/Login.aspx?ReturnUrl=%2f')).toBe(true);
  });

  it('accepts the post-login landing page', () => {
    expect(isLoginPage('https://osadia.wodbuster.com/user/')).toBe(false);
  });
});
