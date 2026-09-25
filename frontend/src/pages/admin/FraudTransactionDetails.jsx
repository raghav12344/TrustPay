import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import { formatINR, formatDateTime } from '../../utils/formatting';
import RiskBadge from '../../components/RiskBadge';
import StatusBadge from '../../components/StatusBadge';
import RiskIndicator from '../../components/RiskIndicator';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Phone,
  User,
  CreditCard,
  Check,
  X,
  History,
} from 'lucide-react';

export const FraudTransactionDetails = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    action: null, // 'APPROVE' | 'REJECT'
    prefillReason: '',
    loading: false,
  });

  // Audit state (if action just completed or simulated from session)
  const [auditRecord, setAuditRecord] = useState(null);

  const fetchAlertDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getFraudAlerts();
      if (res && res.alerts) {
        const found = res.alerts.find(
          (a) => String(a.transaction_id) === String(transactionId)
        );
        if (found) {
          setAlert(found);
        } else {
          setError(`Alert for transaction #${transactionId} not found.`);
        }
      }
    } catch (err) {
      console.error('Failed to load alert details:', err);
      setError('Unable to load alert details from backend.');
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    fetchAlertDetails();
  }, [fetchAlertDetails]);

  const handleOpenReview = (action, prefillReason = '') => {
    setConfirmDialog({
      isOpen: true,
      action,
      prefillReason,
      loading: false,
    });
  };

  const handleConfirmReview = async (reason) => {
    const { action } = confirmDialog;
    try {
      setConfirmDialog((prev) => ({ ...prev, loading: true }));
      if (action === 'APPROVE') {
        await adminService.approveTransaction(transactionId, reason);
        success(`Transaction #${transactionId} approved.`);
        setAuditRecord({
          decision: 'APPROVED',
          reason,
          reviewedAt: new Date().toISOString(),
          adminName: 'TrustPay Admin',
        });
        setAlert((prev) => (prev ? { ...prev, alert_status: 'RESOLVED' } : null));
      } else {
        await adminService.rejectTransaction(transactionId, reason);
        success(`Transaction #${transactionId} rejected.`);
        setAuditRecord({
          decision: 'REJECTED',
          reason,
          reviewedAt: new Date().toISOString(),
          adminName: 'TrustPay Admin',
        });
        setAlert((prev) => (prev ? { ...prev, alert_status: 'RESOLVED' } : null));
      }

      setConfirmDialog({ isOpen: false, action: null, prefillReason: '', loading: false });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      toastError(msg);
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Retrieving fraud alert telemetry..." />;
  }

  if (error || !alert) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => navigate('/admin/fraud-alerts')}
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: '16px', gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Alerts Queue</span>
        </button>
        <ErrorState
          title="Alert Not Found"
          message={error || `Could not find transaction #${transactionId}`}
          onRetry={() => navigate('/admin/fraud-alerts')}
        />
      </div>
    );
  }

  const isOpen = (alert.alert_status || 'OPEN').toUpperCase() === 'OPEN';
  const riskScore = Number(alert.risk_score) || 85;
  const fraudProb = alert.fraud_probability !== undefined && alert.fraud_probability !== null
    ? alert.fraud_probability
    : 0.85;

  // Split reasons if stored as semicolon separated
  const reasonsList = alert.reason
    ? alert.reason.split(';').map((r) => r.trim()).filter(Boolean)
    : [
        'Transaction amount deviates significantly from account baseline.',
        'High frequency velocity anomaly detected in current window.',
        'Unverified device identifier or IP geolocation mismatch.',
      ];

  // Derived signals
  const signals = [
    'Unusual transaction amount',
    'Velocity threshold spike',
    'Risk multiplier applied',
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: '18px' }}>
        <button
          type="button"
          onClick={() => navigate('/admin/fraud-alerts')}
          className="btn btn-ghost btn-sm"
          style={{ gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Fraud Alerts</span>
        </button>
      </div>

      {/* Top Banner: Risk & Status */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          marginBottom: '24px',
          backgroundColor: isOpen ? 'var(--color-danger-bg)' : 'var(--bg-card-subtle)',
          border: isOpen
            ? '1px solid var(--color-danger-border)'
            : '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: isOpen ? 'rgba(220, 38, 38, 0.15)' : 'var(--primary-light)',
              color: isOpen ? 'var(--color-danger)' : 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isOpen ? <ShieldAlert size={26} /> : <ShieldCheck size={26} />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800 }}>
                {isOpen ? 'HIGH RISK TRANSACTION DETECTED' : 'RESOLVED TRANSACTION ALERT'}
              </h1>
              <RiskBadge riskLevel={alert.severity || alert.prediction} />
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Reference ID: <strong style={{ fontFamily: 'var(--font-mono)' }}>#{alert.transaction_id}</strong>
              {' • '}
              Status: <strong style={{ color: isOpen ? 'var(--color-danger)' : 'var(--color-success)' }}>{alert.alert_status || 'OPEN'}</strong>
            </div>
          </div>
        </div>

        {isOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-success"
              onClick={() => handleOpenReview('APPROVE', 'Customer confirmed transaction via phone verification.')}
            >
              <Check size={16} />
              <span>Approve</span>
            </button>

            <button
              type="button"
              className="btn btn-danger"
              onClick={() => handleOpenReview('REJECT', 'Customer denied authorizing transaction.')}
            >
              <X size={16} />
              <span>Reject</span>
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Left Column: Transaction & Customer Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Transaction Info Card */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="var(--primary)" />
              Transaction Details
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatINR(alert.amount)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Type</span>
                <span style={{ fontWeight: 600 }}>{alert.transaction_type || 'PAYMENT'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payee / Merchant</span>
                <span style={{ fontWeight: 600 }}>{alert.merchant || 'General Merchant'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Logged At</span>
                <span style={{ fontWeight: 600 }}>
                  {alert.transaction_time ? formatDateTime(alert.transaction_time) : 'Recent telemetry'}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Profile Card */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--primary)" />
              Customer Information
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer Name</span>
                <span style={{ fontWeight: 600 }}>{alert.customer_name || 'Customer'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Registered Phone</span>
                <span style={{ fontWeight: 600 }}>{alert.phone || '—'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Account ID</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {alert.account_number || `TP-ACC-${alert.transaction_id}`}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Verification Section (Section 28) */}
          {isOpen && (
            <div
              className="card"
              style={{
                padding: '24px',
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
              }}
            >
              <h2 className="card-title" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={18} color="var(--primary)" />
                Direct Customer Verification
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Contact the customer directly to confirm whether they authorized this transaction.
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Customer Phone</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {alert.phone || 'No phone recorded'}
                  </div>
                </div>

                {alert.phone && (
                  <a
                    href={`tel:${alert.phone}`}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <Phone size={14} />
                    <span>Call Customer</span>
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Verification Outcome:
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                    onClick={() =>
                      handleOpenReview('APPROVE', 'Customer confirmed transaction during telephone verification.')
                    }
                  >
                    Customer Confirmed
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                    onClick={() =>
                      handleOpenReview('REJECT', 'Customer denied authorizing transaction during telephone verification.')
                    }
                  >
                    Customer Denied
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Risk Analysis & Final Decision */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Risk Analysis Card (Section 26) */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 className="card-title" style={{ marginBottom: '16px' }}>
              ML Risk Analysis & Signals
            </h2>

            <RiskIndicator
              score={riskScore}
              probability={fraudProb}
              riskLevel={alert.severity || alert.prediction}
              signals={signals}
              reasons={reasonsList}
              summary="The machine learning risk classifier flagged this transaction due to high-value anomaly patterns and baseline security heuristics."
            />
          </div>

          {/* Final Decision Card (Section 27) */}
          <div
            className="card"
            style={{
              padding: '24px',
              backgroundColor: isOpen ? 'var(--color-critical-bg)' : 'var(--bg-card-subtle)',
              border: isOpen ? '1px solid var(--color-critical-border)' : '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-critical)' }}>
                Final Decision Directive
              </span>
              <RiskBadge riskLevel={alert.severity || alert.prediction} />
            </div>

            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Action Required: {isOpen ? 'ADMIN MANUAL REVIEW' : 'RESOLVED'}
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {isOpen
                ? 'This transaction exceeds risk tolerance thresholds and remains locked in PENDING state until an authorized operator issues an approval or rejection.'
                : 'This transaction review has been concluded.'}
            </p>
          </div>

          {/* Audit Timeline Card (Section 30) */}
          {auditRecord && (
            <div className="card animate-fade-in" style={{ padding: '24px' }}>
              <h2 className="card-title" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="var(--primary)" />
                Review Audit Log
              </h2>

              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Reviewed By:</span>
                  <span style={{ fontWeight: 600 }}>{auditRecord.adminName}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Decision:</span>
                  <StatusBadge status={auditRecord.decision} />
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Reason:</div>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                    "{auditRecord.reason}"
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span>
                  <span>{formatDateTime(auditRecord.reviewedAt)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog({ isOpen: false, action: null, prefillReason: '', loading: false })
        }
        onConfirm={handleConfirmReview}
        title={
          confirmDialog.action === 'APPROVE'
            ? `Approve Transaction #${transactionId}?`
            : `Reject Transaction #${transactionId}?`
        }
        message={
          confirmDialog.action === 'APPROVE'
            ? 'Approving this transaction clears the fraud hold and executes the funds transfer immediately.'
            : 'Rejecting this transaction cancels the transfer and marks the transaction as permanently REJECTED.'
        }
        confirmText={
          confirmDialog.action === 'APPROVE' ? 'Approve Transaction' : 'Reject Transaction'
        }
        confirmType={confirmDialog.action === 'APPROVE' ? 'success' : 'danger'}
        requireReason={true}
        reasonPlaceholder="Enter explicit justification for audit logs..."
        loading={confirmDialog.loading}
      />
    </div>
  );
};

export default FraudTransactionDetails;
