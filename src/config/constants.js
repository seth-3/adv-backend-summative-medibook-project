// Clinic business rules. Change them here and the whole app follows.
module.exports = {
  OPENING_HOUR: 9, // first slot starts 09:00
  CLOSING_HOUR: 17, // last slot must end by 17:00
  SLOT_MINUTES: 30,
  MAX_APPOINTMENTS_PER_DAY: 12,

  // Refund policy (hours of notice before the appointment):
  //   more than 48h       -> 100%
  //   24h up to 48h       -> 50%   (exactly 48h and exactly 24h both get 50%)
  //   less than 24h       -> 0%
  FULL_REFUND_HOURS: 48,
  HALF_REFUND_HOURS: 24,

  BUSY_DAY_THRESHOLD: 0.8, // busy day = more than 80% of the daily cap booked
  STATS_DAYS_AHEAD: 7,

  // worker: how many times to retry a "slot freed" job if MySQL is down, and the wait between tries
  WORKER_MAX_RETRIES: 3,
  WORKER_RETRY_DELAY_MS: 2000,
};
