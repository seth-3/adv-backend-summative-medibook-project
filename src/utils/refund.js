const { FULL_REFUND_HOURS, HALF_REFUND_HOURS } = require('../config/constants');

const MS_PER_HOUR = 60 * 60 * 1000;

// Works out the refund from how much notice the patient gave.
// Boundaries: exactly 48h -> 50%, exactly 24h -> 50%.
function calculateRefund(amountPaid, appointmentTime, cancelTime) {
  const hoursNotice = (appointmentTime - cancelTime) / MS_PER_HOUR;

  let percent = 0;
  if (hoursNotice > FULL_REFUND_HOURS) percent = 100;
  else if (hoursNotice >= HALF_REFUND_HOURS) percent = 50;

  // work in cents so 150.00 * 50% never turns into 74.99999
  const amount = Math.round(Number(amountPaid) * 100 * percent / 100) / 100;
  return { percent, amount, hoursNotice: Math.round(hoursNotice * 100) / 100 };
}

module.exports = { calculateRefund };
