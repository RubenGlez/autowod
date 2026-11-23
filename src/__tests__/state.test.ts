import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  allDatesCovered,
  updateState,
  terminalStatusFromResult,
} from '../services/state';
import { ReservationResult } from '../types';

function makeResult(
  state?: ReservationResult['state'],
  success = false
): ReservationResult {
  return { success, message: '', weekDay: 'monday', state };
}

describe('terminalStatusFromResult', () => {
  it('maps Borrar to booked', () => {
    expect(terminalStatusFromResult(makeResult('Borrar'))).toBe('booked');
  });

  it('maps Finalizada to finished', () => {
    expect(terminalStatusFromResult(makeResult('Finalizada'))).toBe('finished');
  });

  it('maps Cambiar to different-time', () => {
    expect(terminalStatusFromResult(makeResult('Cambiar'))).toBe('different-time');
  });

  it('maps successful Entrenar to booked', () => {
    expect(terminalStatusFromResult(makeResult('Entrenar', true))).toBe('booked');
  });

  it('maps successful Avisar to waitlisted', () => {
    expect(terminalStatusFromResult(makeResult('Avisar', true))).toBe('waitlisted');
  });

  it('maps No avisar (already on the waiting list) to waitlisted', () => {
    expect(terminalStatusFromResult(makeResult('No avisar', false))).toBe('waitlisted');
  });

  it('returns null for failed Entrenar (booking error)', () => {
    expect(terminalStatusFromResult(makeResult('Entrenar', false))).toBeNull();
  });

  it('returns null for failed Avisar (waitlist error)', () => {
    expect(terminalStatusFromResult(makeResult('Avisar', false))).toBeNull();
  });

  it('returns null when no button state', () => {
    expect(terminalStatusFromResult(makeResult(undefined))).toBeNull();
  });
});

describe('allDatesCovered', () => {
  it('returns false for empty dates list', () => {
    expect(allDatesCovered({}, [])).toBe(false);
  });

  it('returns false when date is not in state', () => {
    expect(allDatesCovered({}, ['2026-05-19'])).toBe(false);
  });

  it('returns true when all dates have a terminal status', () => {
    expect(allDatesCovered({ '2026-05-19': 'booked' }, ['2026-05-19'])).toBe(true);
  });

  it('returns false when only some dates are covered', () => {
    expect(
      allDatesCovered({ '2026-05-19': 'booked' }, ['2026-05-19', '2026-05-20'])
    ).toBe(false);
  });

  it('accepts all four terminal statuses', () => {
    const state = {
      '2026-05-19': 'booked' as const,
      '2026-05-20': 'waitlisted' as const,
      '2026-05-21': 'finished' as const,
      '2026-05-22': 'different-time' as const,
    };
    expect(allDatesCovered(state, Object.keys(state))).toBe(true);
  });
});

describe('updateState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-19T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a newly booked date', () => {
    const next = updateState({}, [{ date: '2026-05-19', result: makeResult('Borrar') }]);
    expect(next['2026-05-19']).toBe('booked');
  });

  it('adds a waitlisted date', () => {
    const next = updateState({}, [
      { date: '2026-05-20', result: makeResult('Avisar', true) },
    ]);
    expect(next['2026-05-20']).toBe('waitlisted');
  });

  it('prunes dates before today', () => {
    const next = updateState({ '2026-05-18': 'booked' }, []);
    expect(next['2026-05-18']).toBeUndefined();
  });

  it('keeps today and future dates', () => {
    const existing = {
      '2026-05-19': 'booked' as const,
      '2026-05-25': 'waitlisted' as const,
    };
    const next = updateState(existing, []);
    expect(next['2026-05-19']).toBe('booked');
    expect(next['2026-05-25']).toBe('waitlisted');
  });

  it('skips results with no terminal status', () => {
    const next = updateState(
      {},
      [{ date: '2026-05-19', result: makeResult('Entrenar', false) }]
    );
    expect(next['2026-05-19']).toBeUndefined();
  });

  it('skips results with no date', () => {
    const next = updateState(
      {},
      [{ date: undefined, result: makeResult('Borrar') }]
    );
    expect(Object.keys(next)).toHaveLength(0);
  });
});
