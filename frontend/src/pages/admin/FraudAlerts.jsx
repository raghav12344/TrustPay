import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { formatINR } from '../../utils/formatting';
import RiskBadge from '../../components/RiskBadge';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';

export const FraudAlerts = () => {
  const { success, error: toastError } = useToast();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Review Dialog State
  const [reviewDialog, setReviewDialog] = useState({
    isOpen: false,
    action: null,
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
      console.error('Failed to load alerts:', err);
      setError('Unable to load fraud alerts from the backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Search match
      const term = search.toLowerCase();
      const matchSearch =
        !term ||
        String(alert.transaction_id).includes(term) ||
        (alert.customer_name && alert.customer_name.toLowerCase().includes(term)) ||
        (alert.phone && alert.phone.includes(term)) ||
        (alert.reason && alert.reason.toLowerCase().includes(term));

      // Status match
      const alertStatus = (alert.alert_status || 'OPEN').toUpperCase();
      const matchStatus = statusFilter === 'ALL' || alertStatus === statusFilter;

      // Severity match
      const severity = (alert.severity || alert.prediction || 'HIGH').toUpperCase();
      const matchSeverity =
        severityFilter === 'ALL' || severity.includes(severityFilter);

      return matchSearch && matchStatus && matchSeverity;
    });
  }, [alerts, search, statusFilter, severityFilter]);

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
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Fraud Alerts Queue</h1>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>
            High and critical risk transactions requiring manual operator review.
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
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Controls: Search and Filters */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
          <Search
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
            type="text"
            className="form-input"
            placeholder="Search by customer name, phone, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--text-secondary)" />
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="ALL">All Alert Statuses</option>
              <option value="OPEN">Open (Pending Review)</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <select
            className="form-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
          </select>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchAlerts} />
      ) : (
        <div className="card" style={{ padding: '24px' }}>
          {filteredAlerts.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title={alerts.length === 0 ? 'All monitored transactions are currently clear' : 'No alerts match criteria'}
              message={
                alerts.length === 0
                  ? 'There are currently no suspicious or high-risk transactions awaiting review.'
                  : 'Try modifying your search keywords or filter dropdowns.'
              }
            />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Alert #</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Risk Score</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Risk Rationale</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((alert) => {
                    const isOpen = (alert.alert_status || 'OPEN').toUpperCase() === 'OPEN';
                    return (
                      <tr key={alert.transaction_id}>
                        <td>
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
                        </td>

                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {alert.customer_name || 'Customer'}
                        </td>

                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {alert.phone || '—'}
                        </td>

                        <td style={{ fontWeight: 700, fontSize: '14px' }}>
                          {formatINR(alert.amount)}
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '48px',
                                height: '6px',
                                backgroundColor: 'var(--border-color)',
                                borderRadius: '999px',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(alert.risk_score || 0, 100)}%`,
                                  height: '100%',
                                  backgroundColor:
                                    (alert.risk_score || 0) >= 80 ? '#DC2626' : '#D97706',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 700 }}>
                              {alert.risk_score || 0}/100
                            </span>
                          </div>
                        </td>

                        <td>
                          <RiskBadge riskLevel={alert.severity || alert.prediction} />
                        </td>

                        <td>
                          <StatusBadge status={alert.alert_status || 'OPEN'} />
                        </td>

                        <td
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            maxWidth: '220px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={alert.reason || 'Flagged by ML rules'}
                        >
                          {alert.reason || 'Flagged by Sentinel ML engine'}
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
                                  title="Approve"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReview(alert.transaction_id, 'REJECT')}
                                  className="btn btn-danger btn-sm"
                                  title="Reject"
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
      )}

      {/* Review Confirmation Dialog */}
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
            : 'Rejecting this transaction will cancel the funds transfer and log the incident in security audit logs.'
        }
        confirmText={
          reviewDialog.action === 'APPROVE' ? 'Approve Transaction' : 'Reject Transaction'
        }
        confirmType={reviewDialog.action === 'APPROVE' ? 'success' : 'danger'}
        requireReason={true}
        reasonPlaceholder="Enter explicit justification for audit logs..."
        loading={reviewDialog.loading}
      />
    </div>
  );
};

export default FraudAlerts;
