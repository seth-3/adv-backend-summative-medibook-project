const appointmentService = require('../services/appointmentService');
const appointmentModel = require('../models/appointmentModel');
const AppError = require('../utils/AppError');
const { parseId, validateBookingInput } = require('../utils/validators');

function getIdOrFail(req) {
  const id = parseId(req.params.id);
  if (!id) throw new AppError(400, 'Appointment id must be a positive whole number');
  return id;
}

async function book(req, res) {
  const { errors, value } = validateBookingInput(req.body);
  if (errors.length) throw new AppError(400, 'Validation failed', errors);

  const appointment = await appointmentService.bookAppointment(value);
  res.status(201).json(appointment);
}

async function getOne(req, res) {
  const appointment = await appointmentModel.findById(getIdOrFail(req));
  if (!appointment) throw new AppError(404, 'Appointment not found');
  res.json(appointment);
}

async function cancel(req, res) {
  const { appointment, refund } = await appointmentService.cancelAppointment(getIdOrFail(req));
  res.json({
    message: `Appointment cancelled. Refund: ${refund.amount.toFixed(2)} (${refund.percent}%)`,
    refund,
    appointment,
  });
}

module.exports = { book, getOne, cancel };
