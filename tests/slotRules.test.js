const { checkSlotRules } = require('../src/utils/slotRules');
const { parseDateTime } = require('../src/utils/time');

const NOW = new Date(2026, 10, 18, 8, 0); // 18 Nov 2026, 08:00
const slot = (text) => parseDateTime(text);

describe('checkSlotRules', () => {
  test('accepts a future slot on the hour', () => {
    expect(checkSlotRules(slot('2026-12-01 09:00'), NOW)).toBeNull();
  });

  test('accepts the last slot of the day (16:30)', () => {
    expect(checkSlotRules(slot('2026-12-01 16:30'), NOW)).toBeNull();
  });

  test('rejects 17:00 because the slot would end after closing', () => {
    expect(checkSlotRules(slot('2026-12-01 17:00'), NOW)).toMatch(/working hours/);
  });

  test('rejects 08:30, before opening', () => {
    expect(checkSlotRules(slot('2026-12-01 08:30'), NOW)).toMatch(/working hours/);
  });

  test('rejects 09:15, not on a 30-minute boundary', () => {
    expect(checkSlotRules(slot('2026-12-01 09:15'), NOW)).toMatch(/30-minute boundary/);
  });

  test('rejects a slot in the past', () => {
    expect(checkSlotRules(slot('2026-11-17 10:00'), NOW)).toMatch(/future/);
  });

  test('rejects a slot at exactly "now"', () => {
    expect(checkSlotRules(new Date(2026, 10, 18, 9, 0), new Date(2026, 10, 18, 9, 0))).toMatch(/future/);
  });
});

describe('parseDateTime', () => {
  test('reads "YYYY-MM-DD HH:MM" and the ISO "T" format', () => {
    expect(parseDateTime('2026-12-01 09:30')).toEqual(new Date(2026, 11, 1, 9, 30));
    expect(parseDateTime('2026-12-01T09:30:00')).toEqual(new Date(2026, 11, 1, 9, 30));
  });

  test('returns null for malformed or impossible dates', () => {
    expect(parseDateTime('tomorrow at 9')).toBeNull();
    expect(parseDateTime('2026-02-31 10:00')).toBeNull();
    expect(parseDateTime('2026-12-01 25:00')).toBeNull();
    expect(parseDateTime(undefined)).toBeNull();
  });
});
