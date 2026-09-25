-- ==========================================
-- TrustPay - Stored Procedures
-- ==========================================

DELIMITER $$


-- 1. Get all transactions for a customer
CREATE PROCEDURE GetCustomerTransactions(
    IN p_user_id BIGINT
)
BEGIN
    SELECT
        t.transaction_id,
        a.account_number,
        t.amount,
        t.transaction_type,
        t.merchant,
        t.transaction_time,
        t.status
    FROM transactions t
    JOIN accounts a
        ON t.account_id = a.account_id
    WHERE a.user_id = p_user_id
    ORDER BY t.transaction_time DESC;
END $$


-- 2. Get suspicious transactions for admin
CREATE PROCEDURE GetSuspiciousTransactions()
BEGIN
    SELECT
        fm.transaction_id,
        fm.customer_name,
        fm.phone,
        fm.amount,
        fm.transaction_type,
        fm.fraud_probability,
        fm.risk_score,
        fm.prediction,
        fm.severity,
        fm.alert_status,
        fm.reason
    FROM fraud_monitoring fm
    WHERE fm.prediction = 'HIGH_RISK'
       OR fm.severity IN ('HIGH', 'CRITICAL')
    ORDER BY fm.risk_score DESC;
END $$


-- 3. Approve a transaction
CREATE PROCEDURE ApproveTransaction(
    IN p_transaction_id BIGINT,
    IN p_admin_id BIGINT,
    IN p_reason TEXT
)
BEGIN

    DECLARE v_current_status VARCHAR(20) DEFAULT NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Lock the row so two admins can't approve/reject it at the same time.
    SELECT status
    INTO v_current_status
    FROM transactions
    WHERE transaction_id = p_transaction_id
    FOR UPDATE;

    IF v_current_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Transaction not found';
    END IF;

    IF v_current_status <> 'PENDING' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Transaction has already been resolved';
    END IF;

    UPDATE transactions
    SET status = 'APPROVED'
    WHERE transaction_id = p_transaction_id;

    INSERT INTO admin_reviews (
        transaction_id,
        admin_id,
        decision,
        reason
    )
    VALUES (
        p_transaction_id,
        p_admin_id,
        'APPROVED',
        p_reason
    );

    UPDATE fraud_alerts
    SET
        status = 'RESOLVED',
        resolved_at = CURRENT_TIMESTAMP
    WHERE transaction_id = p_transaction_id
      AND status <> 'RESOLVED';

    COMMIT;

END $$


-- 4. Reject a transaction
CREATE PROCEDURE RejectTransaction(
    IN p_transaction_id BIGINT,
    IN p_admin_id BIGINT,
    IN p_reason TEXT
)
BEGIN

    DECLARE v_current_status VARCHAR(20) DEFAULT NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT status
    INTO v_current_status
    FROM transactions
    WHERE transaction_id = p_transaction_id
    FOR UPDATE;

    IF v_current_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Transaction not found';
    END IF;

    IF v_current_status <> 'PENDING' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Transaction has already been resolved';
    END IF;

    UPDATE transactions
    SET status = 'REJECTED'
    WHERE transaction_id = p_transaction_id;

    INSERT INTO admin_reviews (
        transaction_id,
        admin_id,
        decision,
        reason
    )
    VALUES (
        p_transaction_id,
        p_admin_id,
        'REJECTED',
        p_reason
    );

    UPDATE fraud_alerts
    SET
        status = 'RESOLVED',
        resolved_at = CURRENT_TIMESTAMP
    WHERE transaction_id = p_transaction_id
      AND status <> 'RESOLVED';

    COMMIT;

END $$


DELIMITER ;