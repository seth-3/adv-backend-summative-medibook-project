const reportModel = require('../models/reportModel');
const AppError = require('../utils/AppError');
const { parseId } = require('../utils/validators');
const { toSqlDate, toSqlDateTime } = require('../utils/time');
const {
  MAX_APPOINTMENTS_PER_DAY, BUSY_DAY_THRESHOLD, STATS_DAYS_AHEAD,
} = require('../config/constants');

async function doctorStats(req, res) {
  const doctorId = parseId(req.params.id);
  if (!doctorId) throw new AppError(400, 'Doctor id must be a positive whole number');

  const now = new Date();
  const summary = await reportModel.doctorSummary(doctorId, toSqlDateTime(now));
  if (!summary) throw new AppError(404, 'Doctor not found');

  const today = toSqlDate(now);
  const [nextDays, utilization] = await Promise.all([
    reportModel.doctorDailyCounts(doctorId, today, STATS_DAYS_AHEAD, MAX_APPOINTMENTS_PER_DAY),
    reportModel.doctorUtilization(doctorId, today, STATS_DAYS_AHEAD, MAX_APPOINTMENTS_PER_DAY),
  ]);

  res.json({ ...summary, next_7_days: nextDays, utilization_next_7_days: utilization });
}

async function doctorsReport(req, res) {
  res.json(await reportModel.doctorsReport());
}

async function busyDaysReport(req, res) {
  const days = await reportModel.busyDaysReport(MAX_APPOINTMENTS_PER_DAY, BUSY_DAY_THRESHOLD);
  res.json({
    rule: `more than ${BUSY_DAY_THRESHOLD * 100}% of ${MAX_APPOINTMENTS_PER_DAY} daily slots booked`,
    busy_days: days,
  });
}

module.exports = { doctorStats, doctorsReport, busyDaysReport };
