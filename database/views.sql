-- ==========================================
-- TrustPay - Database Views
-- ==========================================

-- 1. Complete transaction information
CREATE OR REPLACE VIEW transaction_details AS
SELECT
    t.transaction_id,
    u.user_id,
    u.name AS customer_name,
    u.email,
    u.phone,
    a.account_number,
    t.amount,
    t.transaction_type,
    t.merchant,
    t.transaction_time,
    t.status,
    l.city,
    l.state,
    l.country
FROM transactions t
JOIN accounts a
    ON t.account_id = a.account_id
JOIN users u
    ON a.user_id = u.user_id
LEFT JOIN locations l
    ON t.location_id = l.location_id;


-- 2. Fraud monitoring view
CREATE OR REPLACE VIEW fraud_monitoring AS
SELECT
    t.transaction_id,
    u.name AS customer_name,
    u.phone,
    t.amount,
    t.transaction_type,
    t.transaction_time,
    t.status AS transaction_status,
    fp.fraud_probability,
    fp.risk_score,
    fp.prediction,
    fa.severity,
    fa.status AS alert_status,
    fa.reason,
    fa.created_at AS alert_created_at
FROM transactions t
JOIN accounts a
    ON t.account_id = a.account_id
JOIN users u
    ON a.user_id = u.user_id
JOIN fraud_predictions fp
    ON t.transaction_id = fp.transaction_id
LEFT JOIN fraud_alerts fa
    ON t.transaction_id = fa.transaction_id;


-- 3. Fraud summary for admin dashboard
CREATE OR REPLACE VIEW fraud_summary AS
SELECT
    fp.prediction,
    COUNT(*) AS total_transactions,
    SUM(t.amount) AS total_amount,
    AVG(fp.risk_score) AS average_risk_score,
    AVG(fp.fraud_probability) AS average_fraud_probability
FROM fraud_predictions fp
JOIN transactions t
    ON fp.transaction_id = t.transaction_id
GROUP BY fp.prediction;