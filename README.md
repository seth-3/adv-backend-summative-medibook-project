# MediBook API

Backend for a clinic appointment booking system. Made with Node.js, Express, MySQL and Redis.

The database diagram is in `schema-diagram.svg`.

## How to run it

You need Node.js (v18 or newer) and Docker.

1. Install the packages
   ```
   npm install
   ```
2. Copy the env file
   ```
   cp .env.example .env
   ```
3. Start MySQL and Redis (I used Docker)
   ```
   docker compose up -d
   ```
4. Create the database and add the sample data
   ```
   docker compose exec -T mysql mysql -uroot -pmedibook < database/schema.sql
   docker compose exec -T mysql mysql -uroot -pmedibook < database/seed.sql
   ```
5. Start the API
   ```
   npm start
   ```
6. In another terminal, start the worker
   ```
   npm run worker
   ```
7. Run the tests (MySQL and Redis are not needed for this)
   ```
   npm test
   ```

The API runs on http://localhost:3000

## Endpoints

- `GET/POST /patients`, `GET/PATCH/DELETE /patients/:id`
- `GET/POST /doctors`, `GET/PATCH/DELETE /doctors/:id`
- `GET /doctors/:id/stats`
- `POST /appointments` - body: `{ "patient_id": 1, "doctor_id": 2, "appt_datetime": "2026-12-10 09:30" }`
- `GET /appointments/:id`
- `POST /appointments/:id/cancellation`
- `POST /waitlist` - body: `{ "patient_id": 1, "doctor_id": 1, "date": "2026-12-10" }`
- `GET /waitlist?doctor_id=1&date=2026-12-10`
- `GET /reports/doctors`
- `GET /reports/busy-days`
- `GET /feedback` and `GET /feedback?lang=fr`

## Why I did things this way

**Two patients can't get the same slot.** There is a `UNIQUE (doctor_id, active_slot)` index. `active_slot` is the appointment time while it is booked and becomes NULL when it is cancelled, so the cancelled row stays (for refund history) but the slot is free again.

**The 12 per day limit.** When booking I lock the doctor's row with `SELECT ... FOR UPDATE` inside a transaction. So two bookings for the same doctor happen one after the other and can't both see "11" and both insert.

**Refunds.** The server works out the refund, the client can't send it. More than 48h before = 100%, from 24h up to 48h = 50%, less than 24h = 0%. So exactly 48h and exactly 24h both get 50%. The cancel and the refund are saved in one UPDATE in a transaction so they can't get out of sync.

**Audit log.** Every booking and cancellation is added as one JSON line to `logs/audit.log` using async `fs/promises`. The folder is created if it's missing. If writing the log fails I only print the error, the request still works.

**Waitlist and worker.** If a slot or day is full you get a 409 that tells you to join the waitlist. The waitlist is a Redis list per doctor and day. When someone cancels, a job goes to Redis and the worker (separate process) books the first person waiting. The worker uses `LMOVE` to move the patient to a "processing" list first, so if the booking fails they are put back at the front of the list and nobody gets lost. If the worker crashes, it puts them back when it starts again. Every confirmed booking also adds a notification job, which the worker writes to the audit log.
