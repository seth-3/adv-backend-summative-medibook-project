const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;

const isText = (maxLength) => (v) =>
  typeof v === 'string' && v.trim().length > 0 && v.trim().length <= maxLength;

const isMoney = (v) =>
  typeof v === 'number' && v >= 0 && Math.abs(v * 100 - Math.round(v * 100)) < 1e-9;

const patientRules = {
  full_name: [isText(100), 'full_name must be a non-empty string (max 100 characters)'],
  email: [(v) => typeof v === 'string' && v.length <= 255 && EMAIL_REGEX.test(v), 'email must be a valid email address'],
  phone: [(v) => typeof v === 'string' && PHONE_REGEX.test(v), 'phone must be 7-20 digits (spaces, +, -, () allowed)'],
};

const doctorRules = {
  full_name: [isText(100), 'full_name must be a non-empty string (max 100 characters)'],
  specialty: [isText(100), 'specialty must be a non-empty string (max 100 characters)'],
  consultation_fee: [isMoney, 'consultation_fee must be a number >= 0 with at most 2 decimal places'],
  room: [isText(10), 'room must be a non-empty string (max 10 characters)'],
};

// Checks body against rules. partial = true is for PATCH: only the fields sent are checked.
// Returns a list of error messages (empty list = valid).
function validateFields(rules, body, partial = false) {
  const data = body || {};
  const errors = [];
  for (const [field, [isValid, message]] of Object.entries(rules)) {
    if (data[field] === undefined) {
      if (!partial) errors.push(`${field} is required`);
    } else if (!isValid(data[field])) {
      errors.push(message);
    }
  }
  const fields = Object.keys(rules);
  if (partial && !fields.some((f) => data[f] !== undefined)) {
    errors.push(`send at least one of: ${fields.join(', ')}`);
  }
  return errors;
}

// Keeps only the allowed fields that were sent (trims strings).
function pickFields(rules, body) {
  const result = {};
  for (const field of Object.keys(rules)) {
    if (body[field] !== undefined) {
      result[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
    }
  }
  return result;
}

// Turns a URL param like "12" into 12. Returns null if it is not a positive whole number.
function parseId(value) {
  if (!/^\d+$/.test(String(value))) return null;
  const id = Number(value);
  return id > 0 && Number.isSafeInteger(id) ? id : null;
}

module.exports = { patientRules, doctorRules, validateFields, pickFields, parseId };
