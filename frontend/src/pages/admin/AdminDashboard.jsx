import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { formatINR } from '../../utils/formatting';
import StatCard from '../../components/StatCard';
import RiskBadge from '../../components/RiskBadge';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import ConfirmDialog from '../../components/ConfirmDialog';
import CreditAccountModal from '../../components/CreditAccountModal';
import { useToast } from '../../context/ToastContext';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Phone,
  Eye,
  ShieldCheck,
  Check,
  X,
  PlusCircle,
} from 'lucide-react';

export const AdminDashboard = () => {
  const { success, error: toastError } = useToast();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);

  // Review modal state
  const [reviewDialog, setReviewDialog] = useState({
    isOpen: false,
    action: null, // 'APPROVE' | 'REJECT'
    transactionId: null,
    loading: false,
  });

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getFraudAlerts();
      if (res && res.alerts) {
        setAlerts(res.alerts);
      }
    } catch (err) {
      console.error('Failed to fetch admin alerts:', err);
      setError('Unable to fetch fraud monitoring alerts. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Compute real metrics from backend alerts
  const totalAlerts = alerts.length;
  const pendingReviews = alerts.filter(
    (a) => (a.alert_status || 'OPEN').toUpperCase() === 'OPEN'
  ).length;
  const highRiskCount = alerts.filter(
    (a) =>
      (a.severity || '').toUpperCase() === 'HIGH' ||
      (a.severity || '').toUpperCase() === 'CRITICAL' ||
      (a.prediction || '').toUpperCase() === 'HIGH_RISK'
  ).length;
  const resolvedCount = alerts.filter(
    (a) => (a.alert_status || '').toUpperCase() === 'RESOLVED'
  ).length;

  // Handle Quick Approve / Quick Reject from Dashboard
  const handleOpenReview = (transactionId, action) => {
    setReviewDialog({
      isOpen: true,
      action,
      transactionId,
      loading: false,
    });
  };

  const handleConfirmReview = async (reason) => {
    const { transactionId, action } = reviewDialog;
    try {
      setReviewDialog((prev) => ({ ...prev, loading: true }));
      if (action === 'APPROVE') {
        await adminService.approveTransaction(transactionId, reason);
        success(`Transaction #${transactionId} approved.`);
      } else {
        await adminService.rejectTransaction(transactionId, reason);
        success(`Transaction #${transactionId} rejected.`);
      }

      setReviewDialog({ isOpen: false, action: null, transactionId: null, loading: false });
      fetchAlerts();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      toastError(msg);
      setReviewDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div>
      {/* Forensic Surveillance Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 8px #ef4444',
                }}
              />
              SENTINEL SURVEILLANCE ACTIVE
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Sub-15ms AI Evaluation
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(24px, 3.5vw, 32px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
            }}
          >
            Threat Surveillance Cockpit
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Live triage queues, multi-layer risk scoring, and zero-knowledge ledger dispute resolution.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchAlerts}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsCreditModalOpen(true)}
          >
            <PlusCircle size={14} color="var(--primary)" />
            <span>Credit Account</span>
          </button>

          <Link to="/admin/fraud-alerts" className="btn btn-primary btn-sm">
            <span>All Alerts</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchAlerts} />
      ) : (
        <>
          {/* Stat Cards Bento Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '18px',
              marginBottom: '32px',
            }}
          >
            <StatCard
              title="Total Suspicious Events"
              value={totalAlerts}
              subtitle="Logged by Sentinel AI"
              icon={ShieldAlert}
              iconBg="var(--color-danger-bg)"
              iconColor="var(--color-danger)"
              loading={loading}
            />

            <StatCard
              title="Pending Reviews"
              value={pendingReviews}
              subtitle={pendingReviews > 0 ? 'Requires manual resolution' : 'Queue cleared'}
              icon={Clock}
              iconBg={pendingReviews > 0 ? 'var(--color-warning-bg)' : 'var(--bg-card-subtle)'}
              iconColor={pendingReviews > 0 ? 'var(--color-warning)' : 'var(--text-muted)'}
              loading={loading}
            />

            <StatCard
              title="High Risk Incidents"
              value={highRiskCount}
              subtitle="Critical probability >= 80%"
              icon={AlertTriangle}
              iconBg="var(--color-critical-bg)"
              iconColor="var(--color-critical)"
              loading={loading}
            />

            <StatCard
              title="Resolved Reviews"
              value={resolvedCount}
              subtitle="Processed by administrators"
              icon={CheckCircle2}
              iconBg="var(--color-success-bg)"
              iconColor="var(--color-success)"
              loading={loading}
            />
          </div>

          {/* High Priority Alerts Table Container */}
          <div className="card" style={{ padding: 'clamp(20px, 3.5vw, 28px)' }}>
            <div className="card-header">
              <div>
                <h2 className="card-title">Priority Fraud Alerts Queue</h2>
                <p className="card-subtitle">
                  Suspicious transactions flagged for immediate security review
                </p>
              </div>

              <Link
                to="/admin/fraud-alerts"
                className="btn btn-ghost btn-sm"
                style={{ gap: '6px', fontWeight: 600 }}
              >
                <span>Full queue ({alerts.length})</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            {alerts.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="All monitored transactions are currently clear"
                message="No transactions have been flagged as HIGH risk or pending review."
              />
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ref ID</th>
                      <th>Customer Details</th>
                      <th>Amount</th>
                      <th>Risk Score</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.slice(0, 8).map((alert) => {
                      const isOpen = (alert.alert_status || 'OPEN').toUpperCase() === 'OPEN';
                      const score = alert.risk_score || 0;
                      return (
                        <tr key={alert.transaction_id}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 700,
                                  color: 'var(--primary)',
                                  fontSize: '13px',
                                }}
                              >
                                #{alert.transaction_id}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {alert.transaction_type || 'PAYMENT'}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {alert.customer_name || 'Customer'}
                              </div>
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  marginTop: '2px',
                                }}
                              >
                                <Phone size={11} />
                                <span>{alert.phone || '—'}</span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '14px',
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {formatINR(alert.amount)}
                            </span>
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '56px',
                                  height: '6px',
                                  backgroundColor: 'var(--border-color)',
                                  borderRadius: '999px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${Math.min(score, 100)}%`,
                                    height: '100%',
                                    backgroundColor:
                                      score >= 80 ? '#ef4444' : score >= 50 ? '#f59e0b' : '#10b981',
                                    borderRadius: '999px',
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                {score}/100
                              </span>
                            </div>
                          </td>

                          <td>
                            <RiskBadge riskLevel={alert.severity || alert.prediction} />
                          </td>

                          <td>
                            <StatusBadge status={alert.alert_status || 'OPEN'} />
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <Link
                                to={`/admin/fraud-alerts/${alert.transaction_id}`}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '6px 12px' }}
                                title="Inspect full alert details"
                              >
                                <Eye size={14} />
                                <span>Inspect</span>
                              </Link>

                              {isOpen && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReview(alert.transaction_id, 'APPROVE')}
                                    className="btn btn-success btn-sm"
                                    style={{ padding: '6px 10px' }}
                                    title="Approve transaction"
                                  >
                                    <Check size={14} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenReview(alert.transaction_id, 'REJECT')}
                                    className="btn btn-danger btn-sm"
                                    style={{ padding: '6px 10px' }}
                                    title="Reject transaction"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Confirmation Dialog for Direct Approve / Reject */}
      <ConfirmDialog
        isOpen={reviewDialog.isOpen}
        onClose={() =>
          setReviewDialog({ isOpen: false, action: null, transactionId: null, loading: false })
        }
        onConfirm={handleConfirmReview}
        title={
          reviewDialog.action === 'APPROVE'
            ? `Approve Transaction #${reviewDialog.transactionId}?`
            : `Reject Transaction #${reviewDialog.transactionId}?`
        }
        message={
          reviewDialog.action === 'APPROVE'
            ? 'Approving this transaction will clear the security hold, finalize the transfer, and mark the alert as RESOLVED.'
            : 'Rejecting this transaction will cancel the funds transfer and flag the event in security logs.'
        }
        confirmText={
          reviewDialog.action === 'APPROVE' ? 'Approve Transaction' : 'Reject Transaction'
        }
        confirmType={reviewDialog.action === 'APPROVE' ? 'success' : 'danger'}
        requireReason={true}
        reasonPlaceholder="Enter explicit justification (e.g., Customer confirmed transaction via phone verification)"
        loading={reviewDialog.loading}
      />

      {/* Credit Account Balance Modal */}
      <CreditAccountModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
      />
    </div>
  );
};

export default AdminDashboard;
