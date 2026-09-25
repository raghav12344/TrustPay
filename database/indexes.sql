-- ==========================================
-- TrustPay - Database Indexes
-- ==========================================

-- Users
CREATE INDEX idx_users_role
ON users(role);

-- Accounts
CREATE INDEX idx_accounts_user
ON accounts(user_id);

-- Transactions
CREATE INDEX idx_transactions_account
ON transactions(account_id);

CREATE INDEX idx_transactions_status
ON transactions(status);

CREATE INDEX idx_transactions_time
ON transactions(transaction_time);

CREATE INDEX idx_transactions_type
ON transactions(transaction_type);

CREATE INDEX idx_transactions_location
ON transactions(location_id);

-- Fraud predictions
CREATE INDEX idx_predictions_transaction
ON fraud_predictions(transaction_id);

CREATE INDEX idx_predictions_risk
ON fraud_predictions(prediction);

CREATE INDEX idx_predictions_score
ON fraud_predictions(risk_score);

-- Fraud alerts
CREATE INDEX idx_alerts_status
ON fraud_alerts(status);

CREATE INDEX idx_alerts_severity
ON fraud_alerts(severity);

CREATE INDEX idx_alerts_created
ON fraud_alerts(created_at);

-- Admin reviews
CREATE INDEX idx_reviews_transaction
ON admin_reviews(transaction_id);

CREATE INDEX idx_reviews_admin
ON admin_reviews(admin_id);

CREATE INDEX idx_reviews_date
ON admin_reviews(reviewed_at);