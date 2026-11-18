const { withTransaction } = require('../models/db');
const appointmentModel = require('../models/appointmentModel');
const doctorModel = require('../models/doctorModel');
const patientModel = require('../models/patientModel');
const AppError = require('../utils/AppError');
const { checkSlotRules } = require('../utils/slotRules');
const { calculateRefund } = require('../utils/refund');
const { parseDateTime, toSqlDateTime, toSqlDate } = require('../utils/time');
const { MAX_APPOINTMENTS_PER_DAY } = require('../config/constants');
const { logEvent } = require('./auditLogger');
const queueService = require('./queueService');

// Booking logic lives here (not in the controller) because the waitlist worker
// books appointments too and must follow exactly the same rules.
// source is 'api' for normal bookings and 'waitlist' when the worker promotes someone.
async function bookAppointment({ patientId, doctorId, slot }, now = new Date(), source = 'api') {
  const ruleError = checkSlotRules(slot, now);
  if (ruleError) throw new AppError(422, ruleError);

  const apptDatetime = toSqlDateTime(slot);
  const date = toSqlDate(slot);

  const appointmentId = await withTransaction(async (connection) => {
    // 1. lock the doctor row -> bookings for this doctor wait for each other
    const doctor = await doctorModel.lockById(connection, doctorId);
    if (!doctor) throw new AppError(404, 'Doctor not found');

    const patient = await patientModel.findById(patientId, connection);
    if (!patient) throw new AppError(404, 'Patient not found');

    // 2. daily cap (safe because of the lock above)
    const bookedThatDay = await appointmentModel.countBookedForDay(connection, doctorId, date);
    if (bookedThatDay >= MAX_APPOINTMENTS_PER_DAY) {
      throw slotUnavailable(`Doctor is fully booked on ${date} (${MAX_APPOINTMENTS_PER_DAY} appointments)`, doctorId, date);
    }

    // 3. insert - the UNIQUE (doctor_id, active_slot) index is the final guard for the slot
    try {
      return await appointmentModel.insert(connection, {
        patientId,
        doctorId,
        apptDatetime,
        amountPaid: doctor.consultation_fee,
        bookedOn: toSqlDateTime(now),
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw slotUnavailable(`Doctor already has an appointment at ${apptDatetime}`, doctorId, date);
      }
      throw err;
    }
  });

  const appointment = await appointmentModel.findById(appointmentId);
  await logEvent('APPOINTMENT_BOOKED', { source, ...summary(appointment) });
  await runSafely('enqueue confirmation', () => queueService.enqueueNotification(summary(appointment)));
  return appointment;
}

async function cancelAppointment(appointmentId, now = new Date()) {
  const refund = await withTransaction(async (connection) => {
    const appointment = await appointmentModel.lockById(connection, appointmentId);
    if (!appointment) throw new AppError(404, 'Appointment not found');
    if (appointment.status === 'CANCELLED') throw new AppError(409, 'Appointment is already cancelled');

    const apptTime = parseDateTime(appointment.appt_datetime);
    if (apptTime <= now) throw new AppError(422, 'Past appointments cannot be cancelled');

    const refund = calculateRefund(appointment.amount_paid, apptTime, now);
    await appointmentModel.markCancelled(connection, appointmentId, {
      cancelledAt: toSqlDateTime(now),
      refundPercent: refund.percent,
      refundAmount: refund.amount,
    });
    return refund;
  });

  const appointment = await appointmentModel.findById(appointmentId);
  await logEvent('APPOINTMENT_CANCELLED', {
    ...summary(appointment), refund_percent: refund.percent, refund_amount: refund.amount,
  });
  // tell the worker a slot is free so it can promote the first waitlisted patient
  await runSafely('notify waitlist', () => queueService.enqueueSlotFreed({
    doctor_id: appointment.doctor_id, appt_datetime: appointment.appt_datetime,
  }));
  return { appointment, refund };
}

function summary(appointment) {
  return {
    appointment_id: appointment.appointment_id,
    patient_id: appointment.patient_id,
    patient_name: appointment.patient_name,
    doctor_id: appointment.doctor_id,
    doctor_name: appointment.doctor_name,
    appt_datetime: appointment.appt_datetime,
  };
}

// The booking/cancellation is already saved in MySQL at this point,
// so a Redis problem is logged but does not fail the request.
async function runSafely(what, fn) {
  try {
    await fn();
  } catch (err) {
    console.error(`Could not ${what}:`, err.message);
    await logEvent('QUEUE_ERROR', { action: what, error: err.message });
  }
}

// 409 error that also tells the client it can join the waitlist
function slotUnavailable(message, doctorId, date) {
  return new AppError(409, message, {
    waitlist: {
      message: 'This slot is not available. You can join the waitlist for this doctor and day.',
      endpoint: 'POST /waitlist',
      body: { doctor_id: doctorId, date },
    },
  });
}

module.exports = { bookAppointment, cancelAppointment };
