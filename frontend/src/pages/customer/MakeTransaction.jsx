import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import accountService from '../../services/accountService';
import transactionService from '../../services/transactionService';
import { formatINR } from '../../utils/formatting';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import {
  Send,
  MapPin,
  MapPinOff,
  ShieldAlert,
  ShieldCheck,
  Clock,
  ArrowRight,
  Loader2,
  CreditCard,
  Building,
  Lock,
  Copy,
  Check,
} from 'lucide-react';

// Synthesize a clean PhonePe-style UPI confirmation chime via Web Audio API
const playPaymentChime = (type = 'success') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'success') {
      // Pleasant ascending 3-note major arpeggio (E5 -> G#5 -> B5 -> E6)
      const notes = [659.25, 830.61, 987.77, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.085);
        gain.gain.setValueAtTime(0.001, now + idx * 0.085);
        gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.085 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.085 + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.085);
        osc.stop(now + idx * 0.085 + 0.4);
      });
    } else {
      // Soft two-tone alert chime for security review hold
      const notes = [523.25, 440.0];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.001, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.14 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.38);
      });
    }
  } catch {
    // AudioContext blocked or unsupported; ignore silently
  }
};

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

  // Submission & PhonePe-style Processing/Receipt Overlay
  const [submitting, setSubmitting] = useState(false);
  const [resultModal, setResultModal] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

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

  // Helper to check single transaction evaluation state (with fallback to list endpoint)
  const checkSingleTransactionState = async (txId) => {
    try {
      const statusData = await transactionService.getTransactionStatus(txId);
      if (statusData && statusData.success) {
        return {
          status: statusData.status,
          evaluated: Boolean(statusData.evaluated),
          flagged: Boolean(statusData.flagged),
          riskLevel: statusData.riskLevel || 'LOW',
          newBalance: statusData.newBalance,
        };
      }
    } catch {
      // Fallback if backend /status endpoint is not yet deployed
      try {
        const listData = await transactionService.getCustomerTransactions();
        const found = listData?.transactions?.find(
          (t) => String(t.transaction_id) === String(txId)
        );
        if (found) {
          const isApprovedOrRejected =
            found.status === 'APPROVED' || found.status === 'REJECTED';
          const hasPrediction =
            found.prediction_id !== undefined && found.prediction_id !== null;
          const hasAlert =
            found.alert_id !== undefined && found.alert_id !== null;
          const rawRisk = found.risk_level || 'LOW_RISK';
          return {
            status: found.status,
            evaluated: isApprovedOrRejected || hasPrediction || hasAlert,
            flagged: hasAlert,
            riskLevel: rawRisk.replace('_RISK', ''),
            newBalance: null,
          };
        }
      } catch {
        // Ignore transient poll error
      }
    }
    return null;
  };

  // If the modal is still in processing state after initial poll (e.g. cloud cold start > 4s),
  // keep polling until evaluation completes and live-update the PhonePe screen in place.
  useEffect(() => {
    if (
      !resultModal ||
      !resultModal.transactionId ||
      resultModal.evaluated ||
      resultModal.status !== 'PENDING'
    ) {
      return;
    }

    let cancelled = false;
    const intervalId = setInterval(async () => {
      const state = await checkSingleTransactionState(resultModal.transactionId);
      if (cancelled || !state) return;

      if (state.evaluated || state.status !== 'PENDING') {
        clearInterval(intervalId);
        let updatedBalance = state.newBalance;
        if (updatedBalance === null || updatedBalance === undefined) {
          try {
            const accRes = await accountService.getMyAccount();
            if (accRes && accRes.account) {
              updatedBalance = accRes.account.balance;
            }
          } catch {
            // Ignore
          }
        }
        if (updatedBalance !== null && updatedBalance !== undefined) {
          setAccount((prev) => (prev ? { ...prev, balance: updatedBalance } : null));
        }

        setResultModal((prev) =>
          prev
            ? {
                ...prev,
                status: state.status,
                evaluated: true,
                processingStep: 3,
                flagged: state.status === 'PENDING' ? true : state.flagged,
                riskLevel: state.riskLevel || prev.riskLevel,
                isMedium: state.riskLevel === 'MEDIUM',
                newBalance: updatedBalance ?? prev.newBalance,
              }
            : null
        );

        if (state.status === 'APPROVED') {
          playPaymentChime('success');
          success('Transaction approved successfully!');
        } else {
          playPaymentChime('hold');
          warning('Transaction flagged for security review.');
        }
      }
    }, 950);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [resultModal, success, warning]);

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

    const payeeLabel = merchant.trim() || transactionType;

    try {
      setSubmitting(true);
      setFormError('');
      setCopiedId(false);

      // Immediately launch the PhonePe-style processing screen at Step 1
      setResultModal({
        transactionId: null,
        amount: numAmount,
        merchant: payeeLabel,
        transactionType,
        status: 'PENDING',
        queued: true,
        evaluated: false,
        flagged: false,
        processingStep: 1, // 1: Initiating, 2: Sentinel AI Screening, 3: Settled
        riskLevel: 'LOW',
        newBalance: null,
        isMedium: false,
        location: null,
      });

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

      // Advance PhonePe screen to Step 2 (Sentinel AI Fraud & Velocity Screening)
      setResultModal((prev) =>
        prev
          ? {
              ...prev,
              transactionId: response.transactionId,
              processingStep: 2,
              location: response.location,
            }
          : null
      );

      let finalStatus = response.status; // 'PENDING' (202 Queued) or 'APPROVED'
      let riskLevel = response.fraud?.final_decision?.final_risk_level || 'LOW';
      let isQueued = Boolean(response.queued);
      let evaluated = finalStatus === 'APPROVED' || Boolean(response.fraud);
      let flagged = finalStatus === 'PENDING' && !isQueued;
      let updatedBalance = response.newBalance;

      // Minimum visual beat on Step 2 so the user sees the PhonePe AI security check animate smoothly
      await new Promise((r) => setTimeout(r, 650));

      // Poll for RabbitMQ + Sentinel AI settlement
      if (isQueued && finalStatus === 'PENDING') {
        for (let attempt = 0; attempt < 7; attempt++) {
          const pollState = await checkSingleTransactionState(response.transactionId);
          if (pollState && (pollState.evaluated || pollState.status !== 'PENDING')) {
            finalStatus = pollState.status;
            evaluated = true;
            flagged = pollState.status === 'PENDING' ? true : pollState.flagged;
            riskLevel = pollState.riskLevel || riskLevel;
            if (pollState.newBalance !== null && pollState.newBalance !== undefined) {
              updatedBalance = pollState.newBalance;
            }
            break;
          }
          await new Promise((r) => setTimeout(r, 550));
        }
      }

      // Refresh account balance if not yet populated
      if (updatedBalance === undefined || updatedBalance === null) {
        try {
          const accRes = await accountService.getMyAccount();
          if (accRes && accRes.account) {
            updatedBalance = accRes.account.balance;
          }
        } catch {
          // Ignore
        }
      }

      if (updatedBalance !== undefined && updatedBalance !== null) {
        setAccount((prev) => (prev ? { ...prev, balance: updatedBalance } : null));
      }

      setResultModal({
        transactionId: response.transactionId,
        amount: numAmount,
        merchant: payeeLabel,
        transactionType,
        status: finalStatus,
        queued: isQueued,
        evaluated,
        flagged,
        processingStep: evaluated ? 3 : 2,
        riskLevel,
        newBalance: updatedBalance,
        isMedium: riskLevel === 'MEDIUM',
        location: response.location,
      });

      if (finalStatus === 'APPROVED') {
        playPaymentChime('success');
        success('Transaction approved successfully!');
      } else if (!evaluated) {
        info('Verifying transaction security with Sentinel AI...');
      } else {
        playPaymentChime('hold');
        warning('Transaction is under security review.');
      }
    } catch (err) {
      console.error('Transaction creation error:', err);
      setResultModal(null);
      const msg =
        err.response?.data?.message ||
        'Unable to process transaction. Please check your network or try again.';
      setFormError(msg);
      error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyTxId = (txId) => {
    if (!txId) return;
    navigator.clipboard.writeText(String(txId));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
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
                <span>Verifying with Sentinel AI...</span>
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

      {/* PhonePe-Style Live Payment Processing & Receipt Screen */}
      {resultModal && (() => {
        const isApproved = resultModal.status === 'APPROVED';
        const isProcessing = !resultModal.evaluated;
        const step = resultModal.processingStep || 1;

        const headerBg = isProcessing
          ? 'linear-gradient(135deg, #5f259f 0%, #4f46e5 55%, #2563eb 100%)'
          : isApproved
          ? 'linear-gradient(135deg, #059669 0%, #10b981 55%, #16a34a 100%)'
          : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)';

        const headerTitle = isProcessing
          ? resultModal.transactionType === 'DEPOSIT'
            ? 'Processing Deposit...'
            : 'Processing Payment...'
          : isApproved
          ? resultModal.transactionType === 'DEPOSIT'
            ? 'Deposit Successful'
            : resultModal.transactionType === 'TRANSFER'
            ? 'Transfer Successful'
            : 'Payment Successful'
          : 'Security Verification Hold';

        return (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              backgroundColor: 'rgba(15, 23, 42, 0.78)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <div
              className="animate-fade-in"
              style={{
                width: '100%',
                maxWidth: '440px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '94vh',
              }}
            >
              {/* Top PhonePe Hero Header */}
              <div
                style={{
                  background: headerBg,
                  padding: '28px 24px 24px',
                  color: '#ffffff',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'background 400ms ease',
                }}
              >
                {/* Animated Icon / Radar Ring */}
                <div
                  style={{
                    position: 'relative',
                    width: '84px',
                    height: '84px',
                    margin: '0 auto 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isProcessing && (
                    <>
                      <div
                        className="phonepe-ripple-1"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%',
                          border: '2px solid rgba(255, 255, 255, 0.45)',
                        }}
                      />
                      <div
                        className="phonepe-ripple-2"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                        }}
                      />
                      {/* Rotating outer ring */}
                      <svg
                        className="animate-spin"
                        style={{ position: 'absolute', inset: '4px', width: '76px', height: '76px' }}
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="44"
                          stroke="rgba(255, 255, 255, 0.2)"
                          strokeWidth="6"
                          fill="none"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="44"
                          stroke="#ffffff"
                          strokeWidth="6"
                          strokeDasharray="180"
                          strokeDashoffset="110"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 255, 255, 0.16)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ShieldCheck size={28} color="#ffffff" />
                      </div>
                    </>
                  )}

                  {!isProcessing && isApproved && (
                    <div
                      className="phonepe-check-pop"
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      <svg width="42" height="42" viewBox="0 0 52 52" fill="none">
                        <path
                          className="phonepe-stroke-draw"
                          d="M14 27L22.5 35.5L38.5 17.5"
                          stroke="#059669"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}

                  {!isProcessing && !isApproved && (
                    <div
                      className="phonepe-check-pop"
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        color: '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      <Clock size={38} strokeWidth={2.4} />
                    </div>
                  )}
                </div>

                {/* Status Title */}
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    marginBottom: '4px',
                  }}
                >
                  {headerTitle}
                </div>

                {/* Giant INR Amount */}
                <div
                  style={{
                    fontSize: '34px',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    marginBottom: '10px',
                  }}
                >
                  {formatINR(resultModal.amount)}
                </div>

                {/* Payee Pill */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 14px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(255, 255, 255, 0.16)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ opacity: 0.85 }}>
                    {resultModal.transactionType === 'DEPOSIT' ? 'Crediting:' : 'To:'}
                  </span>
                  <strong>{resultModal.merchant}</strong>
                </div>
              </div>

              {/* Body: Live 3-Step PhonePe Tracker + Receipt */}
              <div
                style={{
                  padding: '20px 22px 22px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* 3-Step Live Progress Stepper */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {/* Step 1: Payment Initiated */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor:
                          step >= 2 || !isProcessing ? 'var(--color-success)' : 'var(--primary)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {step >= 2 || !isProcessing ? (
                        <Check size={15} strokeWidth={3} />
                      ) : (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Payment Initiated &amp; Balance Verified
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        Account {account?.accountNumber || 'Primary'} liquidity confirmed
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Sentinel AI Fraud Screening */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: !isProcessing
                          ? isApproved
                            ? 'var(--color-success)'
                            : 'var(--color-warning)'
                          : step >= 2
                          ? 'var(--primary)'
                          : 'var(--border-color)',
                        color: !isProcessing || step >= 2 ? '#ffffff' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {!isProcessing ? (
                        isApproved ? (
                          <Check size={15} strokeWidth={3} />
                        ) : (
                          <ShieldAlert size={14} />
                        )
                      ) : step >= 2 ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>2</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Sentinel AI Fraud &amp; Velocity Check
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {!isProcessing
                          ? isApproved
                            ? `Cleared by LightGBM (${resultModal.riskLevel} Risk)`
                            : 'Flagged high-risk anomaly for admin review'
                          : 'Scanning 20 behavioral & Haversine signals...'}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Bank Settlement */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: !isProcessing
                          ? isApproved
                            ? 'var(--color-success)'
                            : 'var(--color-warning)'
                          : 'var(--border-color)',
                        color: !isProcessing ? '#ffffff' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {!isProcessing ? (
                        isApproved ? (
                          <Check size={15} strokeWidth={3} />
                        ) : (
                          <Clock size={14} />
                        )
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>3</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {!isProcessing && !isApproved
                          ? 'Held for Admin Verification'
                          : 'Atomic Bank Ledger Settlement'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {!isProcessing
                          ? isApproved
                            ? 'Transaction settled & balance updated'
                            : 'An administrator will review and resolve shortly'
                          : 'Waiting for security clearance...'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Receipt Details */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    border: '1px solid var(--border-color)',
                    fontSize: '12.5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '9px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Transaction ID:</span>
                    {resultModal.transactionId ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          #{resultModal.transactionId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyTxId(resultModal.transactionId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '2px',
                            display: 'inline-flex',
                          }}
                          title="Copy Transaction ID"
                        >
                          {copiedId ? (
                            <Check size={13} color="var(--color-success)" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Generating...
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                    {isProcessing ? (
                      <span className="badge badge-info">PROCESSING...</span>
                    ) : (
                      <StatusBadge status={resultModal.status} />
                    )}
                  </div>

                  {!isProcessing && isApproved && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Sentinel AI Risk:</span>
                      <RiskBadge riskLevel={resultModal.riskLevel} />
                    </div>
                  )}

                  {!isProcessing &&
                    resultModal.newBalance !== undefined &&
                    resultModal.newBalance !== null && (
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
                        <span style={{ fontWeight: 800, color: 'var(--color-success)', fontSize: '14px' }}>
                          {formatINR(resultModal.newBalance)}
                        </span>
                      </div>
                    )}
                </div>

                {/* Footer: Security Note while Processing OR Action Buttons when Complete */}
                {isProcessing ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '11.5px',
                      color: 'var(--text-muted)',
                      padding: '4px 0',
                    }}
                  >
                    <Lock size={13} />
                    <span>Secured by TrustPay Sentinel AI • Do not press back</span>
                  </div>
                ) : (
                  <div className="modal-cta-group" style={{ display: 'flex', width: '100%', gap: '10px' }}>
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
                      onClick={() =>
                        navigate(
                          resultModal.transactionId
                            ? `/transactions/${resultModal.transactionId}`
                            : '/transactions'
                        )
                      }
                    >
                      <span>View Receipt</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default MakeTransaction;
