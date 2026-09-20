-- ==========================================
-- USERS
-- ==========================================

CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    phone VARCHAR(20) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- ACCOUNTS
-- ==========================================

CREATE TABLE accounts (
    account_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    account_number VARCHAR(20) NOT NULL UNIQUE,

    account_type ENUM('SAVINGS', 'CURRENT') NOT NULL DEFAULT 'SAVINGS',

    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_accounts_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- ==========================================
-- DEVICES
-- ==========================================

CREATE TABLE devices (
    device_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    device_type VARCHAR(50),

    os VARCHAR(50),

    ip_address VARCHAR(45),

    is_trusted BOOLEAN NOT NULL DEFAULT FALSE,

    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_devices_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- ==========================================
-- LOCATIONS
-- ==========================================

CREATE TABLE locations (
    location_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    city VARCHAR(100) NOT NULL,

    state VARCHAR(100),

    country VARCHAR(100) NOT NULL,

    latitude DECIMAL(10,7),

    longitude DECIMAL(10,7)
);


-- ==========================================
-- TRANSACTIONS
-- ==========================================

CREATE TABLE transactions (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    account_id BIGINT NOT NULL,

    device_id BIGINT,

    location_id BIGINT,

    amount DECIMAL(15,2) NOT NULL,

    transaction_type ENUM(
        'TRANSFER',
        'PAYMENT',
        'WITHDRAWAL',
        'DEPOSIT'
    ) NOT NULL,

    merchant VARCHAR(150),

    transaction_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_transaction_amount
        CHECK (amount > 0),

    CONSTRAINT fk_transactions_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id),

    CONSTRAINT fk_transactions_device
        FOREIGN KEY (device_id)
        REFERENCES devices(device_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_transactions_location
        FOREIGN KEY (location_id)
        REFERENCES locations(location_id)
        ON DELETE SET NULL
);


-- ==========================================
-- FRAUD PREDICTIONS
-- ==========================================

CREATE TABLE fraud_predictions (
    prediction_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    transaction_id BIGINT NOT NULL,

    model_id VARCHAR(100) NOT NULL,

    fraud_probability DECIMAL(6,5) NOT NULL,

    risk_score DECIMAL(5,2) NOT NULL,

    prediction ENUM(
        'LOW_RISK',
        'MEDIUM_RISK',
        'HIGH_RISK'
    ) NOT NULL,

    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_fraud_probability
        CHECK (
            fraud_probability >= 0
            AND fraud_probability <= 1
        ),

    CONSTRAINT chk_risk_score
        CHECK (
            risk_score >= 0
            AND risk_score <= 100
        ),

    CONSTRAINT fk_predictions_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(transaction_id)
        ON DELETE CASCADE
);


-- ==========================================
-- FRAUD ALERTS
-- ==========================================

CREATE TABLE fraud_alerts (
    alert_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    transaction_id BIGINT NOT NULL,

    prediction_id BIGINT NOT NULL,

    severity ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ) NOT NULL,

    reason TEXT,

    status ENUM(
        'OPEN',
        'UNDER_REVIEW',
        'RESOLVED'
    ) NOT NULL DEFAULT 'OPEN',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    resolved_at TIMESTAMP NULL,

    CONSTRAINT fk_alerts_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(transaction_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_alerts_prediction
        FOREIGN KEY (prediction_id)
        REFERENCES fraud_predictions(prediction_id)
        ON DELETE CASCADE
);


-- ==========================================
-- ADMIN REVIEWS
-- ==========================================

CREATE TABLE admin_reviews (
    review_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    transaction_id BIGINT NOT NULL,

    admin_id BIGINT NOT NULL,

    decision ENUM(
        'APPROVED',
        'REJECTED'
    ) NOT NULL,

    reason TEXT,

    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reviews_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(transaction_id),

    CONSTRAINT fk_reviews_admin
        FOREIGN KEY (admin_id)
        REFERENCES users(user_id)
);