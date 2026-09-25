import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import accountService from '../../services/accountService';
import transactionService from '../../services/transactionService';
import { formatINR } from '../../utils/formatting';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import {
  Send,
  MapPin,
  MapPinOff,
  ShieldAlert,
  Clock,
  ArrowRight,
  CheckCircle2,
  Loader2,
  CreditCard,
  Building,
} from 'lucide-react';

export const MakeTransaction = () => {
  const navigate = useNavigate();
  const { success, warning, error, info } = useToast();

  const [account, setAccount] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(true);

  // Form inputs
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState('PAYMENT');
  const [merchant, setMerchant] = useState('');
  const [formError, setFormError] = useState('');

  // Location state
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle' | 'requesting' | 'granted' | 'denied'

  // Submission & Result modal
  const [submitting, setSubmitting] = useState(false);
  const [resultModal, setResultModal] = useState(null);

  // Fetch customer account
  useEffect(() => {
    const fetchAccount = async () => {
      try {
        setLoadingAccount(true);
        const data = await accountService.getMyAccount();
        if (data && data.account) {
          setAccount(data.account);
        }
      } catch (err) {
        console.error('Failed to load account:', err);
      } finally {
        setLoadingAccount(false);
      }
    };
    fetchAccount();
  }, []);

  // Request browser geolocation
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      info('Geolocation is not supported by your browser. Transaction can continue without location.');
      return;
    }

    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus('granted');
        success('Location verified for enhanced security.');
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err.message);
        setLocationCoords(null);
        setLocationStatus('denied');
        info('Location access was not granted. Transaction will proceed without geolocation.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!account) {
      setFormError('Account not found. Please refresh and try again.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid amount greater than zero.');
      return;
    }

    if (transactionType !== 'DEPOSIT' && account.balance < numAmount) {
      setFormError(`Insufficient funds. Your available balance is ${formatINR(account.balance)}.`);
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      const payload = {
        accountId: account.accountId,
        amount: numAmount,
        transactionType,
        merchant: merchant ? merchant.trim() : null,
      };

      if (locationCoords) {
        payload.latitude = locationCoords.latitude;
        payload.longitude = locationCoords.longitude;
      }

      const response = await transactionService.createTransaction(payload);

      // Analyze response:
      // Status can be APPROVED or PENDING
      // Fraud object may have final_decision: { final_risk_level, action, reasons }
      const riskLevel = response.fraud?.final_decision?.final_risk_level || 'LOW';
      const status = response.status; // 'APPROVED' or 'PENDING'

      // Update local account balance immediately
      if (response.newBalance !== undefined && response.newBalance !== null) {
        setAccount((prev) => (prev ? { ...prev, balance: response.newBalance } : null));
      } else if (status === 'APPROVED') {
        // Fallback fetch if not returned directly
        accountService.getMyAccount().then((res) => {
          if (res && res.account) setAccount(res.account);
        }).catch(() => {});
      }

      setResultModal({
        transactionId: response.transactionId,
        amount: numAmount,
        merchant: merchant.trim() || transactionType,
        status,
        riskLevel,
        newBalance: response.newBalance,
        isMedium: riskLevel === 'MEDIUM',
        location: response.location,
      });

      if (status === 'APPROVED') {
        success('Transaction approved successfully!');
      } else {
        warning('Transaction is under security review.');
      }
    } catch (err) {
      console.error('Transaction creation error:', err);
      const msg =
        err.response?.data?.message ||
        'Unable to process transaction. Please check your network or try again.';
      setFormError(msg);
      error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setAmount('');
    setMerchant('');
    setTransactionType('PAYMENT');
    setResultModal(null);
    setFormError('');
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Make a Transaction</h1>
        <p style={{ fontSize: '14px', marginTop: '4px' }}>
          Execute funds transfers, payments, deposits, or withdrawals with instant AI verification.
        </p>
      </div>

      <div className="card" style={{ padding: 'clamp(18px, 4vw, 32px)' }}>
        {formError && (
          <div
            className="animate-fade-in"
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-danger)',
              fontSize: '13px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <ShieldAlert size={18} flexShrink={0} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Source Account Info */}
          <div className="form-group">
            <label className="form-label">Debiting Account</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {account ? `${account.accountType} (${account.accountNumber})` : 'Loading account...'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Available balance:{' '}
                    <strong style={{ color: 'var(--color-success)' }}>
                      {loadingAccount ? '...' : formatINR(account?.balance ?? 0)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Type */}
          <div className="form-group">
            <label className="form-label" htmlFor="txType">
              Transaction Type
            </label>
            <select
              id="txType"
              className="form-select"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              disabled={submitting}
            >
              <option value="PAYMENT">Payment (Merchant / Services)</option>
              <option value="TRANSFER">Transfer (Inter-account)</option>
              <option value="WITHDRAWAL">Withdrawal (ATM / Cash Out)</option>
              <option value="DEPOSIT">Deposit (Direct Credit)</option>
            </select>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label" htmlFor="amount">
              Amount (INR ₹)
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 700,
                  fontSize: '16px',
                  color: 'var(--text-secondary)',
                }}
              >
                ₹
              </span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                className="form-input"
                style={{ paddingLeft: '32px', fontSize: '16px', fontWeight: 600 }}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div className="form-hint">
              Enter the exact transaction amount in Indian Rupees.
            </div>
          </div>

          {/* Merchant / Payee */}
          <div className="form-group">
            <label className="form-label" htmlFor="merchant">
              Merchant / Payee Name
            </label>
            <div style={{ position: 'relative' }}>
              <CreditCard
                size={16}
                color="var(--text-muted)"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <input
                id="merchant"
                type="text"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="e.g. Amazon India, Zomato, Reliance Retail..."
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Location Verification (Optional) */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {locationStatus === 'granted' ? (
                  <MapPin size={18} color="var(--color-success)" />
                ) : (
                  <MapPinOff size={18} color="var(--text-muted)" />
                )}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Browser Geolocation (Optional)
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {locationStatus === 'granted'
                      ? 'Location coordinates attached for adaptive risk scoring.'
                      : 'Location helps verify transaction security. You can continue without sharing.'}
                  </div>
                </div>
              </div>

              {locationStatus !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestLocation}
                  disabled={locationStatus === 'requesting' || submitting}
                  className="btn btn-secondary btn-sm"
                >
                  {locationStatus === 'requesting' ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <span>Verify Location</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', gap: '10px' }}
            disabled={submitting || loadingAccount}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Processing transaction...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Submit Transaction</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Transaction Result Modal */}
      {resultModal && (
        <Modal
          isOpen={Boolean(resultModal)}
          onClose={() => setResultModal(null)}
          title={
            resultModal.status === 'APPROVED'
              ? 'Transaction Approved'
              : 'Transaction Under Security Review'
          }
          maxWidth="480px"
          showClose={false}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '12px 0',
            }}
          >
            {/* Status Icon */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor:
                  resultModal.status === 'APPROVED'
                    ? 'var(--color-success-bg)'
                    : 'var(--color-warning-bg)',
                color:
                  resultModal.status === 'APPROVED'
                    ? 'var(--color-success)'
                    : 'var(--color-warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              {resultModal.status === 'APPROVED' ? (
                <CheckCircle2 size={36} strokeWidth={2.2} />
              ) : (
                <Clock size={36} strokeWidth={2.2} />
              )}
            </div>

            <div
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '4px',
              }}
            >
              {formatINR(resultModal.amount)}
            </div>

            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                maxWidth: '360px',
                marginBottom: '20px',
              }}
            >
              {resultModal.status === 'APPROVED' ? (
                resultModal.isMedium ? (
                  <>
                    Your transaction has been successfully processed.{' '}
                    <span style={{ color: 'var(--color-warning)' }}>
                      Additional monitoring was applied.
                    </span>
                  </>
                ) : (
                  'Your transaction has been successfully processed.'
                )
              ) : (
                'Our security system flagged this transaction for additional verification. An administrator will review and resolve it shortly.'
              )}
            </p>

            {/* Transaction Summary Card */}
            <div
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                textAlign: 'left',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Transaction ID:</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  #{resultModal.transactionId}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payee / Merchant:</span>
                <span style={{ fontWeight: 600 }}>{resultModal.merchant}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <StatusBadge status={resultModal.status} />
              </div>

              {resultModal.status === 'APPROVED' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Risk Rating:</span>
                  <RiskBadge riskLevel={resultModal.riskLevel} />
                </div>
              )}

              {resultModal.newBalance !== undefined && resultModal.newBalance !== null && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Updated Balance:</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '14px' }}>
                    {formatINR(resultModal.newBalance)}
                  </span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="modal-cta-group" style={{ display: 'flex', width: '100%', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={handleResetForm}
              >
                Make Another
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => navigate('/transactions')}
              >
                <span>View Transactions</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MakeTransaction;
