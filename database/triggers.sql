-- ==========================================
-- TrustPay - Database Triggers
-- ==========================================

DELIMITER $$


-- 1. Automatically mark a fraud alert as OPEN
--    when a new alert is created.
CREATE TRIGGER trg_fraud_alert_before_insert
BEFORE INSERT ON fraud_alerts
FOR EACH ROW
BEGIN
    IF NEW.status IS NULL THEN
        SET NEW.status = 'OPEN';
    END IF;
END $$


-- 2. Automatically set resolved_at when
--    an alert changes to RESOLVED.
CREATE TRIGGER trg_fraud_alert_resolved
BEFORE UPDATE ON fraud_alerts
FOR EACH ROW
BEGIN
    IF NEW.status = 'RESOLVED'
       AND OLD.status <> 'RESOLVED' THEN
        SET NEW.resolved_at = CURRENT_TIMESTAMP;
    END IF;
END $$


-- 3. Prevent a transaction from being approved
--    or rejected with an invalid amount.
CREATE TRIGGER trg_transaction_before_insert
BEFORE INSERT ON transactions
FOR EACH ROW
BEGIN
    IF NEW.amount <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Transaction amount must be greater than zero';
    END IF;
END $$


DELIMITER ;