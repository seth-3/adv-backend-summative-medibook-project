const { OPENING_HOUR, CLOSING_HOUR, SLOT_MINUTES } = require('../config/constants');

// Checks the booking time rules. Returns an error message, or null if the slot is fine.
// "now" is passed in so the function is easy to unit test with fixed dates.
function checkSlotRules(slot, now) {
  if (slot.getMinutes() % SLOT_MINUTES !== 0 || slot.getSeconds() !== 0) {
    return `Appointments must start on a ${SLOT_MINUTES}-minute boundary (e.g. 09:00 or 09:30)`;
  }
  const minutesFromMidnight = slot.getHours() * 60 + slot.getMinutes();
  const firstSlot = OPENING_HOUR * 60;
  const lastSlot = CLOSING_HOUR * 60 - SLOT_MINUTES;
  if (minutesFromMidnight < firstSlot || minutesFromMidnight > lastSlot) {
    return `Appointments must be within working hours (${OPENING_HOUR}:00-${CLOSING_HOUR}:00)`;
  }
  if (slot <= now) {
    return 'Appointments can only be booked in the future';
  }
  return null;
}

module.exports = { checkSlotRules };
