const { pool } = require('./db');

// Revenue collected = what patients paid minus what was refunded to them.
const REVENUE_SQL = 'COALESCE(SUM(a.amount_paid - COALESCE(a.refund_amount, 0)), 0)';

async function doctorSummary(doctorId, now) {
  const [rows] = await pool.query(
    `SELECT d.doctor_id, d.full_name, d.specialty,
            ${REVENUE_SQL} AS revenue_collected,
            COUNT(CASE WHEN a.status = 'BOOKED' AND a.appt_datetime > ? THEN 1 END) AS upcoming_appointments
     FROM doctors d
     LEFT JOIN appointments a ON a.doctor_id = d.doctor_id
     WHERE d.doctor_id = ?
     GROUP BY d.doctor_id, d.full_name, d.specialty`,
    [now, doctorId],
  );
  return rows[0] || null;
}

// One row per day for the next N days, including days with 0 appointments
// (the recursive CTE makes the list of days, then we LEFT JOIN the bookings).
async function doctorDailyCounts(doctorId, startDate, days, dailyCap) {
  const [rows] = await pool.query(
    `WITH RECURSIVE calendar AS (
       SELECT CAST(? AS DATE) AS day, 1 AS n
       UNION ALL
       SELECT DATE_ADD(day, INTERVAL 1 DAY), n + 1 FROM calendar WHERE n < ?
     )
     SELECT DATE_FORMAT(c.day, '%Y-%m-%d') AS date,
            COUNT(a.appointment_id) AS appointments,
            ROUND(COUNT(a.appointment_id) * 100 / ?, 1) AS utilization_percent
     FROM calendar c
     LEFT JOIN appointments a
       ON a.doctor_id = ? AND a.appt_date = c.day AND a.status = 'BOOKED'
     GROUP BY c.day
     ORDER BY c.day`,
    [startDate, days, dailyCap, doctorId],
  );
  return rows;
}

async function doctorUtilization(doctorId, startDate, days, dailyCap) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS booked_slots,
            ? * ? AS total_slots,
            ROUND(COUNT(*) * 100 / (? * ?), 1) AS utilization_percent
     FROM appointments
     WHERE doctor_id = ? AND status = 'BOOKED'
       AND appt_date BETWEEN ? AND DATE_ADD(?, INTERVAL ? - 1 DAY)`,
    [days, dailyCap, days, dailyCap, doctorId, startDate, startDate, days],
  );
  return rows[0];
}

// Every doctor, even ones with no appointments (LEFT JOIN + COALESCE).
async function doctorsReport() {
  const [rows] = await pool.query(
    `SELECT d.doctor_id, d.full_name, d.specialty,
            COUNT(CASE WHEN a.status = 'BOOKED' THEN 1 END) AS total_appointments,
            COUNT(CASE WHEN a.status = 'CANCELLED' THEN 1 END) AS cancelled_appointments,
            ${REVENUE_SQL} AS revenue_collected
     FROM doctors d
     LEFT JOIN appointments a ON a.doctor_id = d.doctor_id
     GROUP BY d.doctor_id, d.full_name, d.specialty
     ORDER BY revenue_collected DESC, d.doctor_id`,
  );
  return rows;
}

// Every (doctor, date) where more than threshold (e.g. 80%) of the daily cap is booked.
async function busyDaysReport(dailyCap, threshold) {
  const [rows] = await pool.query(
    `SELECT d.doctor_id, d.full_name,
            DATE_FORMAT(a.appt_date, '%Y-%m-%d') AS date,
            COUNT(*) AS booked_slots,
            ? AS daily_capacity,
            ROUND(COUNT(*) * 100 / ?, 1) AS utilization_percent
     FROM appointments a
     JOIN doctors d ON d.doctor_id = a.doctor_id
     WHERE a.status = 'BOOKED'
     GROUP BY d.doctor_id, d.full_name, a.appt_date
     HAVING COUNT(*) > ? * ?
     ORDER BY a.appt_date, d.doctor_id`,
    [dailyCap, dailyCap, dailyCap, threshold],
  );
  return rows;
}

module.exports = {
  doctorSummary, doctorDailyCounts, doctorUtilization, doctorsReport, busyDaysReport,
};
