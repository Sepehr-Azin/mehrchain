import { completionDayKey } from './completion-day';

describe('completionDayKey', () => {
  it('preserves saved account dates across timezones', () => {
    expect(completionDayKey('2026-10-20', 'America/Los_Angeles')).toBe('2026-10-20');
    expect(completionDayKey('2026-10-20', 'Asia/Tehran')).toBe('2026-10-20');
  });

  it('uses the account zone for timestamp history near midnight', () => {
    expect(completionDayKey('2026-10-19T21:00:00Z', 'Asia/Tehran')).toBe('2026-10-20');
    expect(completionDayKey('2026-10-19T21:00:00Z')).toBe('2026-10-19');
    expect(completionDayKey('2026-10-20T01:00:00Z', 'America/Los_Angeles')).toBe('2026-10-19');
  });

  it('preserves legacy calendar-date strings without interpreting device midnight', () => {
    expect(completionDayKey('Tue Oct 20 2026', 'America/Los_Angeles')).toBe('2026-10-20');
  });

  it('does not invent dates from invalid or unzoned values', () => {
    for (const value of [
      '',
      'invalid',
      '2026-02-30',
      '2026-02-30T01:00:00Z',
      '2026-10-20T01:00:00',
    ]) {
      expect(completionDayKey(value)).toBeNull();
    }
  });
});
