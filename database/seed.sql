-- MediBook sample data
-- Run after schema.sql: mysql -u root -p < database/seed.sql

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

-- Dr. Boateng on 2026-12-10: 11 of 12 slots booked (near the daily cap, counts as a busy day)
INSERT INTO appointments (patient_id, doctor_id, appt_datetime, amount_paid, booked_on) VALUES
  (1, 1, '2026-12-10 09:00:00', 150.00, '2026-11-10 08:00:00'),
  (2, 1, '2026-12-10 09:30:00', 150.00, '2026-11-10 08:05:00'),
  (3, 1, '2026-12-10 10:00:00', 150.00, '2026-11-10 08:10:00'),
  (4, 1, '2026-12-10 10:30:00', 150.00, '2026-11-10 08:15:00'),
  (1, 1, '2026-12-10 11:00:00', 150.00, '2026-11-11 09:00:00'),
  (2, 1, '2026-12-10 11:30:00', 150.00, '2026-11-11 09:05:00'),
  (3, 1, '2026-12-10 12:00:00', 150.00, '2026-11-11 09:10:00'),
  (4, 1, '2026-12-10 12:30:00', 150.00, '2026-11-11 09:15:00'),
  (1, 1, '2026-12-10 13:00:00', 150.00, '2026-11-12 11:00:00'),
  (2, 1, '2026-12-10 13:30:00', 150.00, '2026-11-12 11:05:00'),
  (3, 1, '2026-12-10 14:00:00', 150.00, '2026-11-12 11:10:00');

-- a few more upcoming appointments
INSERT INTO appointments (patient_id, doctor_id, appt_datetime, amount_paid, booked_on) VALUES
  (4, 2, '2026-12-01 09:00:00', 100.00, '2026-11-15 14:00:00'),
  (3, 3, '2026-12-02 15:30:00', 200.00, '2026-11-16 09:30:00');

-- a cancelled appointment with its refund (cancelled more than 48h before -> 100%)
INSERT INTO appointments
  (patient_id, doctor_id, appt_datetime, amount_paid, booked_on, status, cancelled_at, refund_percent, refund_amount)
VALUES
  (2, 3, '2026-12-02 16:00:00', 200.00, '2026-11-14 10:00:00', 'CANCELLED', '2026-11-17 12:00:00', 100, 200.00);
