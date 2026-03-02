-- ============================================================
-- MySQL Schema for FastTag Application
-- Equivalent of the existing PostgreSQL/Lovable Cloud schema
-- ============================================================

-- 1. FastTag Sessions
CREATE TABLE IF NOT EXISTS fasttag_sessions (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  bank_id VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  vehicle_number VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) DEFAULT NULL,
  customer_mobile VARCHAR(50) DEFAULT NULL,
  truck_number VARCHAR(255) DEFAULT NULL,
  truck_owner_name VARCHAR(255) DEFAULT NULL,
  opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  start_date DATETIME DEFAULT NULL,
  end_date DATETIME DEFAULT NULL,
  pdf_url TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 2. FastTag History (Transactions)
CREATE TABLE IF NOT EXISTS fasttag_history (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  session_id CHAR(36) NOT NULL,
  processing_time DATETIME DEFAULT NULL,
  transaction_time DATETIME DEFAULT NULL,
  nature VARCHAR(10) NOT NULL COMMENT 'Debit or Credit',
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  closing_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  description TEXT DEFAULT NULL,
  txn_id VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_history_session
    FOREIGN KEY (session_id) REFERENCES fasttag_sessions(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_history_session_id ON fasttag_history(session_id);


-- 3. User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  validity_days INT NOT NULL DEFAULT 30,
  end_date DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_subscriptions_username ON user_subscriptions(username);


-- ============================================================
-- Triggers
-- ============================================================

-- Auto-compute end_date on INSERT
DELIMITER $$
CREATE TRIGGER trg_subscription_end_date_insert
BEFORE INSERT ON user_subscriptions
FOR EACH ROW
BEGIN
  SET NEW.end_date = DATE_ADD(NEW.start_date, INTERVAL NEW.validity_days DAY);
END$$
DELIMITER ;

-- Auto-compute end_date on UPDATE
DELIMITER $$
CREATE TRIGGER trg_subscription_end_date_update
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW
BEGIN
  SET NEW.end_date = DATE_ADD(NEW.start_date, INTERVAL NEW.validity_days DAY);
END$$
DELIMITER ;


-- ============================================================
-- Sample Queries (matching existing app logic)
-- ============================================================

-- Insert a session
-- INSERT INTO fasttag_sessions (bank_id, bank_name, vehicle_number, opening_balance)
-- VALUES ('bank_001', 'HDFC Bank', 'MH12AB1234', 5000.00);

-- Insert history entries
-- INSERT INTO fasttag_history (session_id, nature, amount, closing_balance, description)
-- VALUES ('session-uuid-here', 'Debit', 120.50, 4879.50, 'Toll plaza XYZ');

-- Get sessions by bank and date range (used in Reports)
-- SELECT * FROM fasttag_sessions
-- WHERE bank_id = 'bank_001'
--   AND created_at >= '2026-01-01 00:00:00'
--   AND created_at <= '2026-03-01 23:59:59'
-- ORDER BY created_at DESC;

-- Get transactions by session IDs
-- SELECT * FROM fasttag_history
-- WHERE session_id IN ('uuid1', 'uuid2')
-- ORDER BY created_at ASC;

-- Upsert subscription
-- INSERT INTO user_subscriptions (username, start_date, validity_days, end_date)
-- VALUES ('john_doe', '2026-03-01', 30, '2026-03-31')
-- ON DUPLICATE KEY UPDATE
--   start_date = VALUES(start_date),
--   validity_days = VALUES(validity_days);

-- Get subscription by username
-- SELECT * FROM user_subscriptions
-- WHERE username = 'john_doe'
-- ORDER BY created_at DESC
-- LIMIT 1;
