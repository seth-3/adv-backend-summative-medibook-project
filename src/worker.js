// Background worker - runs as its own process: npm run worker
// 1. "slot freed" jobs  -> book the first patient on the waitlist into the freed slot
// 2. notification jobs  -> "send" the confirmation by writing it to the audit log
const Redis = require('ioredis');
const config = require('./config');
const { pool } = require('./models/db');
const { KEYS, getClient } = require('./services/queueService');
const { bookAppointment } = require('./services/appointmentService');
const { logEvent } = require('./services/auditLogger');
const { parseDateTime } = require('./utils/time');
const { WORKER_MAX_RETRIES, WORKER_RETRY_DELAY_MS } = require('./config/constants');

// BRPOP blocks its connection, so the worker gets its own Redis connection for it.
const blockingRedis = new Redis(config.redisUrl);
const redis = getClient();
let running = true;

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

// If the worker crashed in the middle of a promotion, the patient is still in a
// ":processing" list. Put them back at the FRONT of their waitlist on startup.
async function recoverUnfinishedPromotions() {
  const keys = await redis.keys('waitlist:*:processing');
  for (const processingKey of keys) {
    const waitlistKey = processingKey.replace(/:processing$/, '');
    while (await redis.lmove(processingKey, waitlistKey, 'RIGHT', 'LEFT')) {
      await logEvent('WAITLIST_RECOVERED', { waitlist: waitlistKey });
    }
  }
}

async function handleSlotFreed(job) {
  const doctorId = job.doctor_id;
  const date = job.appt_datetime.slice(0, 10);
  const slot = parseDateTime(job.appt_datetime);
  const waitlistKey = KEYS.waitlist(doctorId, date);
  const processingKey = KEYS.processing(doctorId, date);

  for (;;) {
    // LMOVE is atomic: the patient is moved to the processing list, never just popped
    // and held in memory - so they can't vanish if the booking fails or the worker dies.
    const patientId = await redis.lmove(waitlistKey, processingKey, 'LEFT', 'RIGHT');
    if (!patientId) {
      await logEvent('WAITLIST_EMPTY', { doctor_id: doctorId, appt_datetime: job.appt_datetime });
      return;
    }

    try {
      const appointment = await bookAppointment(
        { patientId: Number(patientId), doctorId, slot },
        new Date(),
        'waitlist',
      );
      await redis.lrem(processingKey, 1, patientId);
      await logEvent('WAITLIST_PROMOTED', { patient_id: Number(patientId), appointment_id: appointment.appointment_id });
      return;
    } catch (err) {
      if (err.statusCode === 404 && err.message === 'Patient not found') {
        // patient was deleted - they can never be booked. Keep a record and try the next person.
        await redis.multi()
          .lrem(processingKey, 1, patientId)
          .rpush(KEYS.failed, JSON.stringify({ patient_id: Number(patientId), doctor_id: doctorId, date, reason: err.message }))
          .exec();
        await logEvent('WAITLIST_PROMOTION_FAILED', { patient_id: Number(patientId), reason: err.message, kept_in: KEYS.failed });
      } else {
        // slot taken again, slot already in the past, MySQL down...
        // put the patient back at the FRONT of the waitlist so they keep their place.
        await redis.lmove(processingKey, waitlistKey, 'RIGHT', 'LEFT');
        await logEvent('WAITLIST_PROMOTION_FAILED', {
          patient_id: Number(patientId), reason: err.message, kept_in: waitlistKey,
        });
        await retryIfUnexpected(err, job);
        return;
      }
    }
  }
}

// Business-rule errors (409/422) won't fix themselves. Other errors (e.g. MySQL down)
// might, so the job is queued again a few times.
async function retryIfUnexpected(err, job) {
  const attempts = (job.attempts || 0) + 1;
  if (err.statusCode || attempts > WORKER_MAX_RETRIES) return;
  await sleep(WORKER_RETRY_DELAY_MS);
  await redis.lpush(KEYS.slotFreed, JSON.stringify({ ...job, attempts }));
}

async function handleNotification(job) {
  await logEvent('CONFIRMATION_SENT', {
    channel: 'sms/email',
    appointment_id: job.appointment_id,
    patient_id: job.patient_id,
    message: `Hello ${job.patient_name}, your appointment with ${job.doctor_name} on ${job.appt_datetime} is confirmed.`,
  });
}

const handlers = {
  [KEYS.slotFreed]: handleSlotFreed,
  [KEYS.notifications]: handleNotification,
};

async function main() {
  if (redis.status !== 'ready') await new Promise((resolve) => { redis.once('ready', resolve); });
  await recoverUnfinishedPromotions();
  console.log('Worker started, waiting for jobs...');

  while (running) {
    // wait up to 5 seconds for a job on either queue
    const result = await blockingRedis.brpop(KEYS.slotFreed, KEYS.notifications, 5);
    if (result) {
      const [queue, rawJob] = result;
      try {
        await handlers[queue](JSON.parse(rawJob));
      } catch (err) {
        console.error(`Job on ${queue} failed:`, err.message);
        await logEvent('JOB_FAILED', { queue, job: rawJob, error: err.message });
      }
    }
  }
}

async function shutdown() {
  running = false;
  console.log('Worker stopping...');
  await sleep(100);
  blockingRedis.disconnect();
  redis.disconnect();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((err) => {
  console.error('Worker crashed:', err);
  process.exit(1);
});
