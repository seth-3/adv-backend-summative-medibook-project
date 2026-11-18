-- MediBook database schema
-- Run on a fresh MySQL 8 server: mysql -u root -p < database/schema.sql

DROP DATABASE IF EXISTS medibook;
CREATE DATABASE medibook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medibook;

CREATE TABLE patients (
  patient_id  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  full_name   VARCHAR(100)  NOT NULL,
  email       VARCHAR(255)  NOT NULL,
  phone       VARCHAR(20)   NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (patient_id),
  CONSTRAINT uq_patients_email UNIQUE (email),
  CONSTRAINT chk_patients_name CHECK (CHAR_LENGTH(TRIM(full_name)) > 0)
);

CREATE TABLE doctors (
  doctor_id         INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  full_name         VARCHAR(100)   NOT NULL,
  specialty         VARCHAR(100)   NOT NULL,
  consultation_fee  DECIMAL(10,2)  NOT NULL,
  room              VARCHAR(10)    NOT NULL,
  created_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (doctor_id),
  CONSTRAINT chk_doctors_fee CHECK (consultation_fee >= 0),
  CONSTRAINT chk_doctors_name CHECK (CHAR_LENGTH(TRIM(full_name)) > 0)
);

CREATE TABLE appointments (
  appointment_id  INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  patient_id      INT UNSIGNED   NOT NULL,
  doctor_id       INT UNSIGNED   NOT NULL,
  appt_datetime   DATETIME       NOT NULL,
  amount_paid     DECIMAL(10,2)  NOT NULL,
  status          ENUM('BOOKED','CANCELLED') NOT NULL DEFAULT 'BOOKED',
  booked_on       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at    DATETIME       NULL,
  refund_percent  TINYINT UNSIGNED NULL,
  refund_amount   DECIMAL(10,2)  NULL,
  -- appt_date is used for the 12-per-day cap and the reports
  appt_date       DATE GENERATED ALWAYS AS (DATE(appt_datetime)) STORED,
  -- active_slot is the slot only while the appointment is BOOKED, NULL once cancelled.
  -- MySQL allows many NULLs in a UNIQUE index, so a cancelled row keeps its history
  -- but no longer blocks the slot.
  active_slot     DATETIME GENERATED ALWAYS AS (IF(status = 'BOOKED', appt_datetime, NULL)) STORED,
  PRIMARY KEY (appointment_id),
  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id)
    REFERENCES patients (patient_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id)
    REFERENCES doctors (doctor_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  -- a doctor cannot have two booked appointments at the same date/time
  CONSTRAINT uq_doctor_active_slot UNIQUE (doctor_id, active_slot),
  -- 30-minute slots between 09:00 and 17:00 (last slot starts 16:30)
  CONSTRAINT chk_appt_slot CHECK (
    MINUTE(appt_datetime) IN (0, 30)
    AND SECOND(appt_datetime) = 0
    AND HOUR(appt_datetime) BETWEEN 9 AND 16
  ),
  CONSTRAINT chk_appt_amount CHECK (amount_paid >= 0),
  -- a cancellation and its refund record always exist together
  CONSTRAINT chk_appt_cancellation CHECK (
    (status = 'BOOKED' AND cancelled_at IS NULL AND refund_percent IS NULL AND refund_amount IS NULL)
    OR
    (status = 'CANCELLED' AND cancelled_at IS NOT NULL AND refund_percent IN (0, 50, 100)
      AND refund_amount IS NOT NULL AND refund_amount BETWEEN 0 AND amount_paid)
  ),
  INDEX idx_appointments_doctor_date (doctor_id, appt_date, status),
  INDEX idx_appointments_patient (patient_id)
);
