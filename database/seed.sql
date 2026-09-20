-- ==========================================
-- TrustPay - Sample Data
-- ==========================================

-- ==========================================
-- USERS
-- ==========================================

INSERT INTO users
(name, email, phone, password_hash, role)
VALUES
(
    'Rohan Sharma',
    'rohan@example.com',
    '9876543210',
    '$2b$10$examplehash1',
    'CUSTOMER'
),
(
    'Priya Singh',
    'priya@example.com',
    '9876543211',
    '$2b$10$examplehash2',
    'CUSTOMER'
),
(
    'Aman Verma',
    'aman@example.com',
    '9876543212',
    '$2b$10$examplehash3',
    'CUSTOMER'
),
(
    'TrustPay Admin',
    'admin@trustpay.com',
    '9876543299',
    '$2b$10$examplehash4',
    'ADMIN'
);


-- ==========================================
-- ACCOUNTS
-- ==========================================

INSERT INTO accounts
(user_id, account_number, account_type, balance)
VALUES
(1, 'TP1000000001', 'SAVINGS', 125000.00),
(2, 'TP1000000002', 'SAVINGS', 85000.00),
(3, 'TP1000000003', 'CURRENT', 250000.00);


-- ==========================================
-- DEVICES
-- ==========================================

INSERT INTO devices
(user_id, device_type, os, ip_address, is_trusted)
VALUES
(1, 'Mobile', 'Android', '192.168.1.10', TRUE),
(1, 'Laptop', 'Windows', '192.168.1.11', TRUE),
(2, 'Mobile', 'Android', '192.168.1.20', TRUE),
(3, 'Laptop', 'Windows', '192.168.1.30', TRUE),
(3, 'Mobile', 'Android', '192.168.1.31', FALSE);


-- ==========================================
-- LOCATIONS
-- ==========================================

INSERT INTO locations
(city, state, country, latitude, longitude)
VALUES
('Prayagraj', 'Uttar Pradesh', 'India', 25.4358, 81.8463),
('New Delhi', 'Delhi', 'India', 28.6139, 77.2090),
('Mumbai', 'Maharashtra', 'India', 19.0760, 72.8777),
('Bengaluru', 'Karnataka', 'India', 12.9716, 77.5946),
('Hyderabad', 'Telangana', 'India', 17.3850, 78.4867);


-- ==========================================
-- TRANSACTIONS
-- ==========================================

INSERT INTO transactions
(account_id, device_id, location_id, amount,
 transaction_type, merchant, transaction_time, status)
VALUES
(
    1, 1, 1, 2500.00,
    'PAYMENT', 'Amazon',
    '2026-09-18 10:30:00',
    'APPROVED'
),
(
    1, 1, 1, 1200.00,
    'PAYMENT', 'Flipkart',
    '2026-09-18 14:15:00',
    'APPROVED'
),
(
    2, 3, 2, 5000.00,
    'TRANSFER', 'Personal Transfer',
    '2026-09-19 11:20:00',
    'APPROVED'
),
(
    3, 5, 4, 75000.00,
    'TRANSFER', 'International Transfer',
    '2026-09-20 02:15:00',
    'PENDING'
),
(
    3, 5, 3, 95000.00,
    'PAYMENT', 'Unknown Merchant',
    '2026-09-20 02:30:00',
    'PENDING'
);


-- ==========================================
-- FRAUD PREDICTIONS
-- ==========================================

INSERT INTO fraud_predictions
(transaction_id, model_id, fraud_probability,
 risk_score, prediction)
VALUES
(
    1, 'lightgbm-v1',
    0.02000, 2.00, 'LOW_RISK'
),
(
    2, 'lightgbm-v1',
    0.04000, 4.00, 'LOW_RISK'
),
(
    3, 'lightgbm-v1',
    0.12000, 12.00, 'LOW_RISK'
),
(
    4, 'lightgbm-v1',
    0.91000, 91.00, 'HIGH_RISK'
),
(
    5, 'lightgbm-v1',
    0.97000, 97.00, 'HIGH_RISK'
);


-- ==========================================
-- FRAUD ALERTS
-- ==========================================

INSERT INTO fraud_alerts
(transaction_id, prediction_id, severity, reason, status)
VALUES
(
    4, 4,
    'HIGH',
    'Large transaction from an unusual device and location during unusual hours.',
    'OPEN'
),
(
    5, 5,
    'CRITICAL',
    'Large transaction from an untrusted device with high fraud probability.',
    'OPEN'
);