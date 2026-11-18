const Redis = require('ioredis');
const config = require('../config');

// Redis keys
//   waitlist:<doctorId>:<date>             FIFO list of patient ids waiting for that doctor/day
//   waitlist:<doctorId>:<date>:processing  patient currently being promoted by the worker
//   waitlist:failed                        patients the worker could not book (kept, never lost)
//   queue:slot-freed                       jobs "a slot was freed by a cancellation"
//   queue:notifications                    jobs "send a confirmation SMS/email"
const KEYS = {
  waitlist: (doctorId, date) => `waitlist:${doctorId}:${date}`,
  processing: (doctorId, date) => `waitlist:${doctorId}:${date}:processing`,
  failed: 'waitlist:failed',
  slotFreed: 'queue:slot-freed',
  notifications: 'queue:notifications',
};

// The web server uses this client. Commands fail fast if Redis is down
// instead of hanging the HTTP request.
let client;
function getClient() {
  if (!client) {
    client = new Redis(config.redisUrl, { maxRetriesPerRequest: 1, enableOfflineQueue: false });
    client.on('error', (err) => console.error('Redis error:', err.message));
  }
  return client;
}

// Adds a patient to the end of the waitlist. Returns their position (1 = next in line),
// or null if they are already on it.
async function joinWaitlist(doctorId, date, patientId) {
  const redis = getClient();
  const key = KEYS.waitlist(doctorId, date);
  if (await redis.lpos(key, String(patientId)) !== null) return null;
  return redis.rpush(key, String(patientId));
}

async function getWaitlist(doctorId, date) {
  const ids = await getClient().lrange(KEYS.waitlist(doctorId, date), 0, -1);
  return ids.map(Number);
}

// Producers use LPUSH, the worker uses BRPOP -> first in, first out.
async function enqueue(queueKey, job) {
  await getClient().lpush(queueKey, JSON.stringify(job));
}

module.exports = {
  KEYS,
  getClient,
  joinWaitlist,
  getWaitlist,
  enqueueSlotFreed: (job) => enqueue(KEYS.slotFreed, job),
  enqueueNotification: (job) => enqueue(KEYS.notifications, job),
};
