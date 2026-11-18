const { calculateRefund } = require('../src/utils/refund');

// fixed appointment time so the tests never depend on "now"
const APPOINTMENT = new Date(2026, 11, 10, 10, 0); // 10 Dec 2026, 10:00
const hoursBefore = (hours) => new Date(APPOINTMENT.getTime() - hours * 60 * 60 * 1000);

describe('calculateRefund', () => {
  test('more than 48 hours notice gives 100%', () => {
    expect(calculateRefund(150, APPOINTMENT, hoursBefore(72))).toMatchObject({ percent: 100, amount: 150 });
  });

  test('exactly 48 hours notice gives 50% (boundary)', () => {
    expect(calculateRefund(150, APPOINTMENT, hoursBefore(48))).toMatchObject({ percent: 50, amount: 75 });
  });

  test('just over 48 hours (48h + 1 minute) gives 100%', () => {
    expect(calculateRefund(150, APPOINTMENT, hoursBefore(48 + 1 / 60)).percent).toBe(100);
  });

  test('between 24 and 48 hours gives 50%', () => {
    expect(calculateRefund(100, APPOINTMENT, hoursBefore(30))).toMatchObject({ percent: 50, amount: 50 });
  });

  test('exactly 24 hours notice gives 50% (boundary)', () => {
    expect(calculateRefund(100, APPOINTMENT, hoursBefore(24))).toMatchObject({ percent: 50, amount: 50 });
  });

  test('just under 24 hours (23h 59m) gives 0%', () => {
    expect(calculateRefund(100, APPOINTMENT, hoursBefore(24 - 1 / 60))).toMatchObject({ percent: 0, amount: 0 });
  });

  test('less than 24 hours gives 0%', () => {
    expect(calculateRefund(200, APPOINTMENT, hoursBefore(2))).toMatchObject({ percent: 0, amount: 0 });
  });

  test('works with the DECIMAL string MySQL returns and rounds to cents', () => {
    expect(calculateRefund('120.55', APPOINTMENT, hoursBefore(30)).amount).toBe(60.28);
  });
});
