-- Razorpay Payment Tables Migration
-- Run this to add Razorpay tables to sas database

USE sas;

-- Ensure invoice_id can store adhoc identifiers like ADHOC_...
ALTER TABLE payment_attempts
  MODIFY invoice_id VARCHAR(255) NOT NULL;

-- Table: payment_attempts
-- Stores all payment initiation attempts
CREATE TABLE IF NOT EXISTS payment_attempts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  invoice_id VARCHAR(255) NOT NULL,
  attempt_reference VARCHAR(128) NOT NULL UNIQUE,
  razorpay_order_id VARCHAR(128),
  razorpay_payment_id VARCHAR(128),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'INR',
  status VARCHAR(24) DEFAULT 'created',
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_razorpay_order_id (razorpay_order_id),
  INDEX idx_razorpay_payment_id (razorpay_payment_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: razorpay_payments
-- Stores successful Razorpay payment records
CREATE TABLE IF NOT EXISTS razorpay_payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  payment_attempt_id BIGINT NOT NULL,
  razorpay_payment_id VARCHAR(128) UNIQUE NOT NULL,
  method VARCHAR(64),
  status VARCHAR(24),
  amount DECIMAL(12,2) NOT NULL,
  fee_charged DECIMAL(12,2) DEFAULT 0,
  response_json JSON,
  captured_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_attempt_id) REFERENCES payment_attempts(id),
  INDEX idx_razorpay_payment_id (razorpay_payment_id),
  INDEX idx_status (status),
  INDEX idx_captured_at (captured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: refunds
-- Stores refund records
CREATE TABLE IF NOT EXISTS refunds (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  payment_id BIGINT NOT NULL,
  razorpay_refund_id VARCHAR(128) UNIQUE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(24) DEFAULT 'processing',
  response_json JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES razorpay_payments(id),
  INDEX idx_razorpay_refund_id (razorpay_refund_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: webhook_events
-- Stores all webhook events from Razorpay
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(128) NOT NULL,
  event_payload JSON NOT NULL,
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN DEFAULT FALSE,
  processing_log TEXT,
  INDEX idx_event_type (event_type),
  INDEX idx_processed (processed),
  INDEX idx_received_at (received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Razorpay tables created successfully!' AS message;
