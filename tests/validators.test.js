const {
  validateFields, patientRules, doctorRules, parseId, validateWaitlistInput,
} = require('../src/utils/validators');

describe('validateFields', () => {
  test('a complete valid patient has no errors', () => {
    const body = { full_name: 'Ama Mensah', email: 'ama@mail.com', phone: '0244-111-222' };
    expect(validateFields(patientRules, body)).toEqual([]);
  });

  test('missing fields are reported on create', () => {
    expect(validateFields(patientRules, { full_name: 'Ama' })).toEqual(['email is required', 'phone is required']);
  });

  test('PATCH (partial) only checks the fields that were sent', () => {
    expect(validateFields(patientRules, { phone: '0244-111-222' }, true)).toEqual([]);
  });

  test('PATCH with an empty body is rejected', () => {
    expect(validateFields(doctorRules, {}, true)[0]).toMatch(/send at least one of/);
  });

  test('a fee with more than 2 decimals or below 0 is rejected', () => {
    expect(validateFields(doctorRules, { consultation_fee: 10.555 }, true)).toHaveLength(1);
    expect(validateFields(doctorRules, { consultation_fee: -5 }, true)).toHaveLength(1);
    expect(validateFields(doctorRules, { consultation_fee: 150.5 }, true)).toEqual([]);
  });

  test('a name made only of spaces is rejected', () => {
    expect(validateFields(doctorRules, { full_name: '   ' }, true)).toHaveLength(1);
  });
});

describe('parseId', () => {
  test('accepts positive whole numbers only', () => {
    expect(parseId('12')).toBe(12);
    expect(parseId(3)).toBe(3);
    expect(parseId('0')).toBeNull();
    expect(parseId('-1')).toBeNull();
    expect(parseId('1.5')).toBeNull();
    expect(parseId('abc')).toBeNull();
  });
});

describe('validateWaitlistInput', () => {
  test('rejects a date in the past and an impossible date', () => {
    const today = '2026-11-18';
    expect(validateWaitlistInput({ patient_id: 1, doctor_id: 1, date: '2026-11-17' }, today).errors)
      .toEqual(['date cannot be in the past']);
    expect(validateWaitlistInput({ patient_id: 1, doctor_id: 1, date: '2026-02-30' }, today).errors).toHaveLength(1);
    expect(validateWaitlistInput({ patient_id: 1, doctor_id: 1, date: '2026-11-18' }, today).errors).toEqual([]);
  });
});
