-- MediBook sample data
-- Run after schema.sql: mysql -u root -p < database/seed.sql
-- Upcoming appointments use dates relative to today (CURDATE()) so they are
-- always in the future and show up in the "next 7 days" statistics.

USE medibook;

INSERT INTO patients (full_name, email, phone) VALUES
  ('Ama Mensah',  'ama@mail.com',  '0244-111-222'),
  ('Kojo Owusu',  'kojo@mail.com', '0555-333-444'),
  ('Efua Asante', 'efua@mail.com', '0201-555-666'),
  ('Yaw Darko',   'yaw@mail.com',  '0277-777-888');

INSERT INTO doctors (full_name, specialty, consultation_fee, room) VALUES
  ('Dr. Boateng', 'Dermatology', 150.00, 'R-12'),
  ('Dr. Adjei',   'Paediatrics', 100.00, 'R-03'),
  ('Dr. Ofori',   'Cardiology',  200.00, 'R-07'),
  ('Dr. Nkrumah', 'General Practice', 80.00, 'R-01'); -- has no appointments

-- the 3 rows from the old spreadsheet (past appointments)
INSERT INTO appointments (patient_id, doctor_id, appt_datetime, amount_paid, booked_on) VALUES
  (1, 1, '2026-08-10 09:00:00', 150.00, '2026-07-01 10:00:00'),
  (2, 1, '2026-08-10 09:30:00', 120.00, '2026-07-02 10:00:00'),
  (1, 2, '2026-08-15 10:00:00', 100.00, '2026-07-03 10:00:00');

-- Dr. Boateng in 3 days: 11 of 12 slots booked (near the daily cap, counts as a busy day)
SET @busy_day = CURDATE() + INTERVAL 3 DAY;
INSERT INTO appointments (patient_id, doctor_id, appt_datetime, amount_paid, booked_on) VALUES
  (1, 1, TIMESTAMP(@busy_day, '09:00:00'), 150.00, NOW() - INTERVAL 5 DAY),
  (2, 1, TIMESTAMP(@busy_day, '09:30:00'), 150.00, NOW() - INTERVAL 5 DAY),
  (3, 1, TIMESTAMP(@busy_day, '10:00:00'), 150.00, NOW() - INTERVAL 5 DAY),
  (4, 1, TIMESTAMP(@busy_day, '10:30:00'), 150.00, NOW() - INTERVAL 5 DAY),
  (1, 1, TIMESTAMP(@busy_day, '11:00:00'), 150.00, NOW() - INTERVAL 4 DAY),
  (2, 1, TIMESTAMP(@busy_day, '11:30:00'), 150.00, NOW() - INTERVAL 4 DAY),
  (3, 1, TIMESTAMP(@busy_day, '12:00:00'), 150.00, NOW() - INTERVAL 4 DAY),
  (4, 1, TIMESTAMP(@busy_day, '12:30:00'), 150.00, NOW() - INTERVAL 4 DAY),
  (1, 1, TIMESTAMP(@busy_day, '13:00:00'), 150.00, NOW() - INTERVAL 3 DAY),
  (2, 1, TIMESTAMP(@busy_day, '13:30:00'), 150.00, NOW() - INTERVAL 3 DAY),
  (3, 1, TIMESTAMP(@busy_day, '14:00:00'), 150.00, NOW() - INTERVAL 3 DAY);

-- a few more upcoming appointments
INSERT INTO appointments (patient_id, doctor_id, appt_datetime, amount_paid, booked_on) VALUES
  (4, 2, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '09:00:00'), 100.00, NOW() - INTERVAL 2 DAY),
  (3, 3, TIMESTAMP(CURDATE() + INTERVAL 5 DAY, '15:30:00'), 200.00, NOW() - INTERVAL 2 DAY);

-- a cancelled appointment with its refund (cancelled more than 48h before -> 100%)
INSERT INTO appointments
  (patient_id, doctor_id, appt_datetime, amount_paid, booked_on, status, cancelled_at, refund_percent, refund_amount)
VALUES
  (2, 3, TIMESTAMP(CURDATE() + INTERVAL 5 DAY, '16:00:00'), 200.00, NOW() - INTERVAL 3 DAY,
   'CANCELLED', NOW() - INTERVAL 1 DAY, 100, 200.00);
