const { pool } = require('./db');

const COLUMNS = `a.appointment_id, a.patient_id, p.full_name AS patient_name,
  a.doctor_id, d.full_name AS doctor_name, d.room,
  a.appt_datetime, a.amount_paid, a.status, a.booked_on,
  a.cancelled_at, a.refund_percent, a.refund_amount`;

const FROM = `FROM appointments a
  JOIN patients p ON p.patient_id = a.patient_id
  JOIN doctors d ON d.doctor_id = a.doctor_id`;

async function findById(id, connection = pool) {
  const [rows] = await connection.query(`SELECT ${COLUMNS} ${FROM} WHERE a.appointment_id = ?`, [id]);
  return rows[0] || null;
}

// Same as findById but locks the row (used when cancelling).
async function lockById(connection, id) {
  const [rows] = await connection.query(
    'SELECT appointment_id, appt_datetime, amount_paid, status, doctor_id FROM appointments WHERE appointment_id = ? FOR UPDATE',
    [id],
  );
  return rows[0] || null;
}

async function countBookedForDay(connection, doctorId, date) {
  const [rows] = await connection.query(
    "SELECT COUNT(*) AS total FROM appointments WHERE doctor_id = ? AND appt_date = ? AND status = 'BOOKED'",
    [doctorId, date],
  );
  return rows[0].total;
}

async function insert(connection, { patientId, doctorId, apptDatetime, amountPaid, bookedOn }) {
  const [result] = await connection.query(
    'INSERT INTO appointments (patient_id, doctor_id, appt_datetime, amount_paid, booked_on) VALUES (?, ?, ?, ?, ?)',
    [patientId, doctorId, apptDatetime, amountPaid, bookedOn],
  );
  return result.insertId;
}

// Cancellation and refund are saved in ONE update, so they can't get out of sync.
async function markCancelled(connection, id, { cancelledAt, refundPercent, refundAmount }) {
  const [result] = await connection.query(
    `UPDATE appointments
     SET status = 'CANCELLED', cancelled_at = ?, refund_percent = ?, refund_amount = ?
     WHERE appointment_id = ? AND status = 'BOOKED'`,
    [cancelledAt, refundPercent, refundAmount, id],
  );
  return result.affectedRows > 0;
}

module.exports = { findById, lockById, countBookedForDay, insert, markCancelled };
