-- ==========================================
-- TrustPay - Important SQL Queries
-- ==========================================


-- ==========================================
-- 1. Get all customers and their accounts
-- Demonstrates JOIN
-- ==========================================

SELECT
    u.user_id,
    u.name,
    u.email,
    u.phone,
    a.account_number,
    a.account_type,
    a.balance
FROM users u
JOIN accounts a
    ON u.user_id = a.user_id;


-- ==========================================
-- 2. Get complete transaction information
-- Demonstrates multiple JOINs
-- ==========================================

SELECT
    t.transaction_id,
    u.name AS customer_name,
    a.account_number,
    t.amount,
    t.transaction_type,
    t.merchant,
    t.status,
    l.city,
    l.state,
    t.transaction_time
FROM transactions t
JOIN accounts a
    ON t.account_id = a.account_id
JOIN users u
    ON a.user_id = u.user_id
LEFT JOIN locations l
    ON t.location_id = l.location_id
ORDER BY t.transaction_time DESC;


-- ==========================================
-- 3. Find high-value transactions
-- Demonstrates WHERE
-- ==========================================

SELECT
    transaction_id,
    account_id,
    amount,
    transaction_type,
    merchant,
    status
FROM transactions
WHERE amount >= 50000
ORDER BY amount DESC;


-- ==========================================
-- 4. Find high-risk transactions
-- ==========================================

SELECT
    t.transaction_id,
    u.name AS customer_name,
    t.amount,
    fp.fraud_probability,
    fp.risk_score,
    fp.prediction
FROM transactions t
JOIN accounts a
    ON t.account_id = a.account_id
JOIN users u
    ON a.user_id = u.user_id
JOIN fraud_predictions fp
    ON t.transaction_id = fp.transaction_id
WHERE fp.prediction = 'HIGH_RISK'
ORDER BY fp.risk_score DESC;


-- ==========================================
-- 5. Count transactions by status
-- Demonstrates GROUP BY
-- ==========================================

SELECT
    status,
    COUNT(*) AS total_transactions
FROM transactions
GROUP BY status;


-- ==========================================
-- 6. Total transaction amount by type
-- Demonstrates SUM + GROUP BY
-- ==========================================

SELECT
    transaction_type,
    COUNT(*) AS transaction_count,
    SUM(amount) AS total_amount
FROM transactions
GROUP BY transaction_type
ORDER BY total_amount DESC;


-- ==========================================
-- 7. Average transaction amount
-- Demonstrates AVG
-- ==========================================

SELECT
    AVG(amount) AS average_transaction_amount
FROM transactions;


-- ==========================================
-- 8. Fraud statistics
-- ==========================================

SELECT
    prediction,
    COUNT(*) AS total_transactions,
    AVG(fraud_probability) AS average_fraud_probability,
    AVG(risk_score) AS average_risk_score
FROM fraud_predictions
GROUP BY prediction;


-- ==========================================
-- 9. Fraud by location
-- Useful for admin analytics
-- ==========================================

SELECT
    l.city,
    l.state,
    COUNT(t.transaction_id) AS total_transactions,
    SUM(t.amount) AS total_amount,
    AVG(fp.risk_score) AS average_risk_score
FROM transactions t
JOIN locations l
    ON t.location_id = l.location_id
LEFT JOIN fraud_predictions fp
    ON t.transaction_id = fp.transaction_id
GROUP BY l.city, l.state
ORDER BY average_risk_score DESC;


-- ==========================================
-- 10. Open fraud alerts
-- ==========================================

SELECT
    fa.alert_id,
    fa.transaction_id,
    u.name AS customer_name,
    u.phone,
    t.amount,
    fa.severity,
    fa.reason,
    fa.created_at
FROM fraud_alerts fa
JOIN transactions t
    ON fa.transaction_id = t.transaction_id
JOIN accounts a
    ON t.account_id = a.account_id
JOIN users u
    ON a.user_id = u.user_id
WHERE fa.status = 'OPEN'
ORDER BY fa.severity DESC, fa.created_at DESC;


-- ==========================================
-- 11. Customers with suspicious transactions
-- Demonstrates DISTINCT
-- ==========================================

SELECT DISTINCT
    u.user_id,
    u.name,
    u.email,
    u.phone
FROM users u
JOIN accounts a
    ON u.user_id = a.user_id
JOIN transactions t
    ON a.account_id = t.account_id
JOIN fraud_predictions fp
    ON t.transaction_id = fp.transaction_id
WHERE fp.prediction = 'HIGH_RISK';


-- ==========================================
-- 12. Transactions above the average amount
-- Demonstrates subquery
-- ==========================================

SELECT
    transaction_id,
    amount,
    transaction_type,
    merchant
FROM transactions
WHERE amount > (
    SELECT AVG(amount)
    FROM transactions
)
ORDER BY amount DESC;


-- ==========================================
-- 13. Top customers by transaction volume
-- Demonstrates GROUP BY + ORDER BY
-- ==========================================

SELECT
    u.user_id,
    u.name,
    COUNT(t.transaction_id) AS transaction_count,
    SUM(t.amount) AS total_transaction_amount
FROM users u
JOIN accounts a
    ON u.user_id = a.user_id
JOIN transactions t
    ON a.account_id = t.account_id
GROUP BY u.user_id, u.name
ORDER BY total_transaction_amount DESC;


-- ==========================================
-- 14. Fraud percentage
-- ==========================================

SELECT
    ROUND(
        100.0 *
        SUM(
            CASE
                WHEN fp.prediction = 'HIGH_RISK' THEN 1
                ELSE 0
            END
        ) / COUNT(*),
        2
    ) AS high_risk_percentage
FROM fraud_predictions fp;


-- ==========================================
-- 15. Risk distribution
-- Useful for admin dashboard
-- ==========================================

SELECT
    prediction AS risk_level,
    COUNT(*) AS transaction_count
FROM fraud_predictions
GROUP BY prediction
ORDER BY transaction_count DESC;