const queueService = require('../services/queueService');
const patientModel = require('../models/patientModel');
const doctorModel = require('../models/doctorModel');
const AppError = require('../utils/AppError');
const { parseId, validateWaitlistInput } = require('../utils/validators');
const { isValidDate, toSqlDate } = require('../utils/time');

// Redis errors become a clear 503 instead of a generic 500
async function useRedis(fn) {
  try {
    return await fn();
  } catch (err) {
    console.error('Waitlist Redis error:', err.message);
    throw new AppError(503, 'The waitlist is not available right now, please try again later');
  }
}

async function join(req, res) {
  const { errors, value } = validateWaitlistInput(req.body, toSqlDate(new Date()));
  if (errors.length) throw new AppError(400, 'Validation failed', errors);
  const { patientId, doctorId, date } = value;

  const [patient, doctor] = await Promise.all([
    patientModel.findById(patientId),
    doctorModel.findById(doctorId),
  ]);
  if (!patient) throw new AppError(404, 'Patient not found');
  if (!doctor) throw new AppError(404, 'Doctor not found');

  const position = await useRedis(() => queueService.joinWaitlist(doctorId, date, patientId));
  if (position === null) throw new AppError(409, 'Patient is already on the waitlist for this doctor and day');

  res.status(201).json({
    message: 'Added to the waitlist. You will be booked automatically when a slot frees up.',
    patient_id: patientId,
    doctor_id: doctorId,
    date,
    position,
  });
}

async function list(req, res) {
  const doctorId = parseId(req.query.doctor_id);
  const { date } = req.query;
  if (!doctorId || !isValidDate(date)) {
    throw new AppError(400, 'Query must include doctor_id and date, e.g. ?doctor_id=1&date=2026-12-10');
  }
  const patientIds = await useRedis(() => queueService.getWaitlist(doctorId, date));
  res.json({ doctor_id: doctorId, date, waiting_patient_ids: patientIds });
}

module.exports = { join, list };
