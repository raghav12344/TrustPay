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
  Sparkles,
  ArrowUpRight,
  Wallet,
  Zap,
} from 'lucide-react';

// Synthesize a clean PhonePe-style UPI confirmation chime via Web Audio API
const playPaymentChime = (type = 'success') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'success') {
      // Pleasant ascending 4-note major arpeggio (E5 -> G#5 -> B5 -> E6)
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

  // Submission & Apple Pay / PhonePe-style Processing Sheet
  const [submitting, setSubmitting] = useState(false);
  const [resultModal, setResultModal] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Quick preset amount buttons
  const amountPresets = [500, 1000, 2500, 5000, 10000];

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

  // If the modal is still in processing state after initial poll, keep polling until evaluation completes
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

      // Immediately launch the processing screen at Step 1
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

      // Advance screen to Step 2 (Sentinel AI Fraud & Velocity Screening)
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

      let finalStatus = response.status;
      let riskLevel = response.fraud?.final_decision?.final_risk_level || 'LOW';
      let isQueued = Boolean(response.queued);
      let evaluated = finalStatus === 'APPROVED' || Boolean(response.fraud);
      let flagged = finalStatus === 'PENDING' && !isQueued;
      let updatedBalance = response.newBalance;

      // Minimum visual beat on Step 2 so the user sees the security check animate smoothly
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
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '999px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '12px',
            fontWeight: 700,
            marginBottom: '10px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <Zap size={13} />
          <span>Real-time Sentinel AI Pipeline</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(26px, 4vw, 34px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
          }}
        >
          Execute Transfer
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Ultra-low latency settlement with automatic risk scoring and geo-velocity verification.
        </p>
      </div>

      <div
        className="apple-glass-card"
        style={{
          padding: 'clamp(20px, 4.5vw, 36px)',
          borderRadius: '24px',
          boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.15)',
        }}
      >
        {formError && (
          <div
            className="animate-fade-in"
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: '16px',
              color: 'var(--color-danger)',
              fontSize: '13px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Debiting Account Card Banner */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--bg-card-subtle)',
              borderRadius: '18px',
              border: '1px solid var(--border-color)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
                }}
              >
                <Building size={20} />
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {account
                    ? `${account.accountType} (•••• ${String(account.accountNumber).slice(-4)})`
                    : 'Loading account...'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Available balance:{' '}
                  <strong style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                    {loadingAccount ? '...' : formatINR(account?.balance ?? 0)}
                  </strong>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '999px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={12} />
              <span>Verified</span>
            </div>
          </div>

          {/* Transaction Type Segmented Control */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ marginBottom: '10px' }}>
              Select Operation
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px',
                padding: '4px',
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
              }}
            >
              {[
                { id: 'PAYMENT', label: 'Payment' },
                { id: 'TRANSFER', label: 'Transfer' },
                { id: 'WITHDRAWAL', label: 'Withdrawal' },
                { id: 'DEPOSIT', label: 'Deposit' },
              ].map((tab) => {
                const active = transactionType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTransactionType(tab.id)}
                    disabled={submitting}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      backgroundColor: active ? 'var(--bg-card)' : 'transparent',
                      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Big Currency Amount Input */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" htmlFor="amount">
              Amount
            </label>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-input)',
                borderRadius: '18px',
                border: '1px solid var(--border-color)',
                padding: '14px 20px',
                transition: 'border-color 0.2s',
              }}
            >
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  marginRight: '12px',
                  userSelect: 'none',
                }}
              >
                ₹
              </span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 'clamp(28px, 4vw, 36px)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            {/* Quick Amount Chips */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '10px',
              }}
            >
              {amountPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  disabled={submitting}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  +₹{preset.toLocaleString('en-IN')}
                </button>
              ))}

              {account?.balance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(account.balance))}
                  disabled={submitting}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#0284c7',
                    cursor: 'pointer',
                  }}
                >
                  Max Balance
                </button>
              )}
            </div>
          </div>

          {/* Payee / Merchant Input */}
          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label className="form-label" htmlFor="merchant">
              Recipient / Merchant Reference
            </label>
            <div style={{ position: 'relative' }}>
              <CreditCard
                size={16}
                color="var(--text-muted)"
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <input
                id="merchant"
                type="text"
                className="form-input"
                style={{ paddingLeft: '44px', borderRadius: '16px', height: '48px' }}
                placeholder="e.g. Amazon India, Zomato, Reliance Retail, or Recipient Name"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Geolocation Verification Tile */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '18px',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {locationStatus === 'granted' ? (
                <MapPin size={18} color="#10b981" />
              ) : (
                <MapPinOff size={18} color="var(--text-muted)" />
              )}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Hardware Geolocation
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {locationStatus === 'granted'
                    ? 'Coordinates attached for speed/velocity anomaly detection.'
                    : 'Attaches browser coordinates to satisfy adaptive risk checks.'}
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
                  <span>Verify GPS</span>
                )}
              </button>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{
              width: '100%',
              gap: '10px',
              borderRadius: '16px',
              padding: '14px 24px',
              fontSize: '15px',
            }}
            disabled={submitting || loadingAccount}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Screening with Sentinel AI...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Confirm & Authorize</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Apple Pay-Style Live Payment Processing & Receipt Sheet */}
      {resultModal && (() => {
        const isApproved = resultModal.status === 'APPROVED';
        const isProcessing = !resultModal.evaluated;
        const step = resultModal.processingStep || 1;

        const headerBg = isProcessing
          ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #1e3a8a 100%)'
          : isApproved
          ? 'linear-gradient(135deg, #064e3b 0%, #047857 45%, #059669 100%)'
          : 'linear-gradient(135deg, #78350f 0%, #b45309 100%)';

        const headerTitle = isProcessing
          ? resultModal.transactionType === 'DEPOSIT'
            ? 'Processing Deposit...'
            : 'Authorizing Payment...'
          : isApproved
          ? resultModal.transactionType === 'DEPOSIT'
            ? 'Deposit Complete'
            : resultModal.transactionType === 'TRANSFER'
            ? 'Transfer Complete'
            : 'Payment Authorized'
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
              backgroundColor: 'rgba(11, 15, 25, 0.82)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              className="animate-fade-in"
              style={{
                width: '100%',
                maxWidth: '460px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '28px',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.55)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '94vh',
              }}
            >
              {/* Sheet Hero Header */}
              <div
                style={{
                  background: headerBg,
                  padding: '32px 24px 26px',
                  color: '#ffffff',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'background 400ms ease',
                }}
              >
                {/* Glowing Radar Ring */}
                <div
                  style={{
                    position: 'relative',
                    width: '88px',
                    height: '88px',
                    margin: '0 auto 16px',
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
                    </>
                  )}

                  <div
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.22)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {isProcessing ? (
                      <Loader2 size={32} className="animate-spin" color="#ffffff" />
                    ) : isApproved ? (
                      <Check size={36} color="#ffffff" strokeWidth={3} />
                    ) : (
                      <Clock size={34} color="#ffffff" strokeWidth={2.5} />
                    )}
                  </div>
                </div>

                <h3
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    marginBottom: '4px',
                  }}
                >
                  {headerTitle}
                </h3>

                <p style={{ fontSize: '13px', opacity: 0.88, margin: 0 }}>
                  {isProcessing
                    ? step === 1
                      ? 'Step 1/3: Publishing to RabbitMQ ledger...'
                      : 'Step 2/3: Evaluating ML isolation forest...'
                    : isApproved
                    ? 'Settled securely via Sentinel zero-knowledge pipeline'
                    : 'Flagged for forensic review by compliance'}
                </p>

                <div
                  style={{
                    marginTop: '16px',
                    fontSize: 'clamp(32px, 6vw, 42px)',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {formatINR(resultModal.amount)}
                </div>
              </div>

              {/* Sheet Body & Telemetry Breakdown */}
              <div
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  overflowY: 'auto',
                }}
              >
                {/* 3-Step Live Progress Indicator */}
                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: 'var(--bg-card-subtle)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginBottom: '8px',
                    }}
                  >
                    <span>Pipeline Status</span>
                    <span>{step}/3 Completed</span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '6px',
                    }}
                  >
                    <div
                      style={{
                        height: '4px',
                        borderRadius: '999px',
                        backgroundColor: '#10b981',
                      }}
                    />
                    <div
                      style={{
                        height: '4px',
                        borderRadius: '999px',
                        backgroundColor: step >= 2 ? '#10b981' : 'var(--border-color)',
                        transition: 'background-color 0.3s',
                      }}
                    />
                    <div
                      style={{
                        height: '4px',
                        borderRadius: '999px',
                        backgroundColor:
                          step >= 3
                            ? isApproved
                              ? '#10b981'
                              : '#d97706'
                            : 'var(--border-color)',
                        transition: 'background-color 0.3s',
                      }}
                    />
                  </div>
                </div>

                {/* Details Breakdown */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    fontSize: '13px',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-card-subtle)',
                    }}
                  >
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Recipient</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {resultModal.merchant}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-card-subtle)',
                    }}
                  >
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Operation</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {resultModal.transactionType}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-card-subtle)',
                    }}
                  >
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Risk Level</div>
                    <div style={{ marginTop: '2px' }}>
                      <RiskBadge riskLevel={resultModal.riskLevel} />
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-card-subtle)',
                    }}
                  >
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Ref ID</div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginTop: '2px',
                      }}
                    >
                      <span>#{resultModal.transactionId || 'Pending'}</span>
                      {resultModal.transactionId && (
                        <button
                          type="button"
                          onClick={() => handleCopyTxId(resultModal.transactionId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: 0,
                          }}
                          title="Copy ID"
                        >
                          {copiedId ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1, borderRadius: '14px' }}
                    onClick={handleResetForm}
                  >
                    Make Another
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, borderRadius: '14px' }}
                    onClick={() => navigate('/transactions')}
                  >
                    View History
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default MakeTransaction;
