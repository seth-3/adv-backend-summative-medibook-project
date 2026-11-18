// All times are clinic local time. We keep them as "YYYY-MM-DD HH:MM:SS" strings
// for MySQL and turn them into Date objects only to compare them.

const DATETIME_REGEX = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;
const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n) => String(n).padStart(2, '0');

// "2026-12-10 09:30" or "2026-12-10T09:30:00" -> Date. Returns null if malformed or not a real date.
function parseDateTime(value) {
  const match = typeof value === 'string' ? value.match(DATETIME_REGEX) : null;
  if (!match) return null;
  const [, y, mo, d, h, mi, s = '0'] = match;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  const sameAsTyped = date.getFullYear() === Number(y) && date.getMonth() === Number(mo) - 1
    && date.getDate() === Number(d) && date.getHours() === Number(h) && date.getMinutes() === Number(mi);
  return sameAsTyped ? date : null;
}

// "2026-12-10" -> true/false (also rejects 2026-02-31)
function isValidDate(value) {
  const match = typeof value === 'string' ? value.match(DATE_REGEX) : null;
  return Boolean(match) && parseDateTime(`${value} 00:00`) !== null;
}

function toSqlDateTime(date) {
  return `${toSqlDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function toSqlDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

module.exports = { parseDateTime, isValidDate, toSqlDateTime, toSqlDate };
