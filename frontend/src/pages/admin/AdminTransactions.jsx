import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { formatINR, formatDateTime } from '../../utils/formatting';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import {
  Receipt,
  Search,
  RefreshCw,
  User,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Smartphone,
  MapPin,
  ExternalLink,
  ChevronRight,
  X,
} from 'lucide-react';

export const AdminTransactions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalCount: 0,
    totalVolume: 0,
    passedCount: 0,
    reviewedCount: 0,
    pendingCount: 0,
    pendingErrorCount: 0,
    pendingAlertCount: 0,
    rejectedCount: 0,
  });

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const initialCustomerId = searchParams.get('customerId') || searchParams.get('userId') || 'ALL';
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialSearch = searchParams.get('search') || '';

  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  // Modal inspection & review
  const [selectedTx, setSelectedTx] = useState(null);
  const [reviewReason, setReviewReason] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Fetch customers for filter dropdown
  const loadCustomers = useCallback(async () => {
    try {
      const res = await adminService.getAllAccounts();
      if (res && res.accounts) {
        setCustomers(res.accounts);
      }
    } catch (err) {
      console.error('Failed to load customers for filter:', err);
    }
  }, []);

  // Fetch transactions from backend
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCustomerId && selectedCustomerId !== 'ALL') {
        params.customerId = selectedCustomerId;
      }
      if (categoryFilter && categoryFilter !== 'ALL') {
        params.category = categoryFilter;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const res = await adminService.getAllTransactions(params);
      if (res && res.success) {
        setTransactions(res.transactions || []);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
      toast.error('Unable to fetch transaction records. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCustomerId, categoryFilter, searchTerm, toast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Synchronize URL query params
  useEffect(() => {
    const params = {};
    if (selectedCustomerId !== 'ALL') params.customerId = selectedCustomerId;
    if (categoryFilter !== 'ALL') params.category = categoryFilter;
    if (searchTerm.trim()) params.search = searchTerm.trim();
    setSearchParams(params, { replace: true });
  }, [selectedCustomerId, categoryFilter, searchTerm, setSearchParams]);

  // Filter in-memory for type
  const displayedTransactions = useMemo(() => {
    if (typeFilter === 'ALL') return transactions;
    return transactions.filter(
      (tx) => tx.transactionType && tx.transactionType.toUpperCase() === typeFilter
    );
  }, [transactions, typeFilter]);

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(true);
    toast.info(`Transaction ID #${id} copied to clipboard`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleOpenDetailModal = (tx) => {
    setSelectedTx(tx);
    setReviewReason('');
  };

  const handleCloseDetailModal = () => {
    setSelectedTx(null);
    setReviewReason('');
  };

  // Review actions (Approve / Reject)
  const handleApprove = async () => {
    if (!selectedTx) return;
    const reasonText = reviewReason.trim() || 'Approved by compliance administrator.';
    try {
      setActionLoading(true);
      const res = await adminService.approveTransaction(selectedTx.transactionId, reasonText);
      if (res && res.success) {
        toast.success(
          `Transaction #${selectedTx.transactionId} approved successfully.${res.newBalance !== null ? ` Customer balance updated to ${formatINR(res.newBalance)}.` : ''}`
        );
        handleCloseDetailModal();
        fetchTransactions();
      }
    } catch (err) {
      console.error('Failed to approve transaction:', err);
      toast.error(err.response?.data?.message || 'Failed to approve transaction.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTx) return;
    if (!reviewReason.trim()) {
      toast.warning('Please enter a rejection reason for the audit log.');
      return;
    }
    try {
      setActionLoading(true);
      const res = await adminService.rejectTransaction(selectedTx.transactionId, reviewReason.trim());
      if (res && res.success) {
        toast.success(`Transaction #${selectedTx.transactionId} marked as REJECTED.`);
        handleCloseDetailModal();
        fetchTransactions();
      }
    } catch (err) {
      console.error('Failed to reject transaction:', err);
      toast.error(err.response?.data?.message || 'Failed to reject transaction.');
    } finally {
      setActionLoading(false);
    }
  };

  // Get diagnostic badge styling
  const renderDiagnosisPill = (tx) => {
    const code = tx.diagnosis?.code || 'UNKNOWN';

    if (code === 'PASSED_AUTO') {
      return (
        <span
          className="badge badge-approved"
          title="Low/Medium risk anomaly score. Auto-cleared by Sentinel."
          style={{ fontSize: '11px', gap: '4px' }}
        >
          <CheckCircle2 size={11} />
          <span>Auto-Cleared</span>
        </span>
      );
    }

    if (code === 'REVIEWED_APPROVED') {
      return (
        <span
          className="badge"
          title={tx.diagnosis?.description}
          style={{
            fontSize: '11px',
            gap: '4px',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            color: 'var(--primary)',
            border: '1px solid rgba(37, 99, 235, 0.3)',
          }}
        >
          <ShieldCheck size={11} />
          <span>Admin Approved</span>
        </span>
      );
    }

    if (code === 'PENDING_ERROR') {
      return (
        <span
          className="badge"
          title="Analysis service error/timeout hold. Needs manual clearance."
          style={{
            fontSize: '11px',
            gap: '4px',
            backgroundColor: 'rgba(234, 88, 12, 0.15)',
            color: '#EA580C',
            border: '1px solid rgba(234, 88, 12, 0.35)',
            fontWeight: 700,
          }}
        >
          <AlertTriangle size={11} />
          <span>Analysis Error Hold</span>
        </span>
      );
    }

    if (code === 'PENDING_ALERT') {
      return (
        <span
          className="badge badge-pending"
          title={tx.fraudAlert?.reason || 'Flagged by Sentinel AI. Awaiting review.'}
          style={{ fontSize: '11px', gap: '4px' }}
        >
          <Clock size={11} />
          <span>Security Flag Hold</span>
        </span>
      );
    }

    if (code === 'REVIEWED_REJECTED') {
      return (
        <span
          className="badge badge-rejected"
          title={tx.diagnosis?.description}
          style={{ fontSize: '11px', gap: '4px' }}
        >
          <XCircle size={11} />
          <span>Admin Rejected</span>
        </span>
      );
    }

    if (tx.status === 'REJECTED') {
      return (
        <span className="badge badge-rejected" style={{ fontSize: '11px', gap: '4px' }}>
          <XCircle size={11} />
          <span>Rejected</span>
        </span>
      );
    }

    return (
      <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
        {tx.status}
      </span>
    );
  };

  const selectedCustomerObj = customers.find(
    (c) => String(c.userId) === String(selectedCustomerId)
  );

  return (
    <div>
      {/* Header & Quick Controls */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Customer Transactions</h1>
            <span
              className="badge badge-neutral"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
            >
              {stats.totalCount} Total
            </span>
          </div>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>
            Omnichannel ledger across all customer accounts. Audit auto-cleared, reviewed, and error-held transactions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchTransactions}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Total Volume
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatINR(stats.totalVolume)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {stats.totalCount} transactions
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '16px',
            cursor: 'pointer',
            borderColor: categoryFilter === 'PASSED' ? 'var(--color-success)' : undefined,
          }}
          onClick={() => setCategoryFilter(categoryFilter === 'PASSED' ? 'ALL' : 'PASSED')}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={13} color="var(--color-success)" />
            <span>Passed & Cleared</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-success)' }}>
            {stats.passedCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Instant & approved
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '16px',
            cursor: 'pointer',
            borderColor: categoryFilter === 'REVIEWED' ? 'var(--primary)' : undefined,
          }}
          onClick={() => setCategoryFilter(categoryFilter === 'REVIEWED' ? 'ALL' : 'REVIEWED')}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={13} color="var(--primary)" />
            <span>Admin Reviewed</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
            {stats.reviewedCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Manual audit trail
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '16px',
            cursor: 'pointer',
            borderColor: categoryFilter === 'PENDING_ERROR' ? '#EA580C' : undefined,
            backgroundColor: stats.pendingErrorCount > 0 ? 'rgba(234, 88, 12, 0.05)' : undefined,
          }}
          onClick={() => setCategoryFilter(categoryFilter === 'PENDING_ERROR' ? 'ALL' : 'PENDING_ERROR')}
        >
          <div style={{ fontSize: '12px', color: '#EA580C', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <AlertTriangle size={13} color="#EA580C" />
            <span>Error Holds</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#EA580C' }}>
            {stats.pendingErrorCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Analysis service failure
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '16px',
            cursor: 'pointer',
            borderColor: categoryFilter === 'PENDING_ALERT' ? 'var(--color-warning)' : undefined,
          }}
          onClick={() => setCategoryFilter(categoryFilter === 'PENDING_ALERT' ? 'ALL' : 'PENDING_ALERT')}
        >
          <div style={{ fontSize: '12px', color: 'var(--color-warning)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <Clock size={13} color="var(--color-warning)" />
            <span>Security Flags</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-warning)' }}>
            {stats.pendingAlertCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            High-risk alert holds
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '16px',
            cursor: 'pointer',
            borderColor: categoryFilter === 'REJECTED' ? 'var(--color-danger)' : undefined,
          }}
          onClick={() => setCategoryFilter(categoryFilter === 'REJECTED' ? 'ALL' : 'REJECTED')}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <XCircle size={13} color="var(--color-danger)" />
            <span>Rejected</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-danger)' }}>
            {stats.rejectedCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Blocked transactions
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '18px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          {/* Customer Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 280px' }}>
            <label
              htmlFor="customer-filter-select"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <User size={15} color="var(--primary)" />
              <span>Customer:</span>
            </label>
            <select
              id="customer-filter-select"
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              style={{ maxWidth: '340px' }}
            >
              <option value="ALL">All Customers (Global Ledger)</option>
              {customers.map((c) => (
                <option key={c.userId} value={c.userId}>
                  {c.customerName} ({c.accountNumber})
                </option>
              ))}
            </select>

            {selectedCustomerId !== 'ALL' && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedCustomerId('ALL')}
                title="Clear customer filter"
              >
                <X size={13} />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
            <Search
              size={15}
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
              placeholder="Search by customer, account #, merchant, TX ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* Selected Customer Banner if filtered */}
        {selectedCustomerObj && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-card-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                Viewing: {selectedCustomerObj.customerName}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--primary)',
                  fontWeight: 600,
                }}
              >
                Acc: {selectedCustomerObj.accountNumber}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                Phone: {selectedCustomerObj.phone}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                Balance: {formatINR(selectedCustomerObj.balance)}
              </span>
            </div>
            <Link
              to={`/admin/customers`}
              style={{
                fontSize: '12px',
                color: 'var(--primary)',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>View in Customer Directory</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        )}

        {/* Category Tabs & Type Select */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '14px',
          }}
        >
          {/* Category Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              { id: 'ALL', label: 'All Transactions' },
              { id: 'PASSED', label: 'Passed / Cleared' },
              { id: 'REVIEWED', label: 'Admin Reviewed' },
              { id: 'PENDING_ERROR', label: 'Error Holds', badge: stats.pendingErrorCount },
              { id: 'PENDING_ALERT', label: 'Security Flags', badge: stats.pendingAlertCount },
              { id: 'REJECTED', label: 'Rejected' },
            ].map((tab) => {
              const isActive = categoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-card-subtle)',
                    borderColor: isActive ? 'var(--primary)' : 'var(--border-color)',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        backgroundColor: isActive ? '#FFFFFF' : tab.id === 'PENDING_ERROR' ? '#EA580C' : 'var(--color-warning)',
                        color: isActive ? 'var(--primary)' : '#FFFFFF',
                        fontWeight: 700,
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Type:</span>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: '4px 10px', fontSize: '12px', height: '32px' }}
            >
              <option value="ALL">All Types</option>
              <option value="PAYMENT">Payment</option>
              <option value="TRANSFER">Transfer</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="DEPOSIT">Deposit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="card" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ width: '100%', height: '56px', borderRadius: 'var(--radius-md)' }}
              />
            ))}
          </div>
        ) : displayedTransactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={transactions.length === 0 ? 'No transactions found' : 'No transactions match filters'}
            message={
              selectedCustomerId !== 'ALL'
                ? 'No transactions found for this customer under current filter criteria.'
                : 'Customer transactions will appear here once executed.'
            }
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>TX ID & Time</th>
                  <th>Customer</th>
                  <th>Type & Merchant</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Status</th>
                  <th>Diagnosis / Clearance</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedTransactions.map((tx) => (
                  <tr
                    key={tx.transactionId}
                    style={{
                      backgroundColor:
                        tx.diagnosis?.code === 'PENDING_ERROR'
                          ? 'rgba(234, 88, 12, 0.03)'
                          : undefined,
                    }}
                  >
                    {/* TX ID & Time */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                            }}
                          >
                            #{tx.transactionId}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyId(tx.transactionId);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              color: 'var(--text-muted)',
                              display: 'inline-flex',
                            }}
                            title="Copy ID"
                          >
                            {copiedId ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {formatDateTime(tx.transactionTime || tx.createdAt)}
                        </span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                          }}
                          onClick={() => setSelectedCustomerId(String(tx.userId))}
                          title="Filter to this customer"
                        >
                          {tx.customerName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                              color: 'var(--primary)',
                            }}
                          >
                            {tx.accountNumber}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            • {tx.customerPhone}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Type & Merchant */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                            {tx.transactionType}
                          </span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {tx.merchant || 'General Transfer'}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color:
                            tx.transactionType === 'DEPOSIT'
                              ? 'var(--color-success)'
                              : 'var(--text-primary)',
                        }}
                      >
                        {tx.transactionType === 'DEPOSIT' ? '+' : ''}
                        {formatINR(tx.amount)}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={tx.status} />
                    </td>

                    {/* Diagnosis / Condition */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {renderDiagnosisPill(tx)}
                        {tx.diagnosis?.code === 'PENDING_ERROR' && (
                          <span style={{ fontSize: '11px', color: '#EA580C', fontWeight: 500 }}>
                            ML analysis failed / timed out
                          </span>
                        )}
                        {tx.review && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            By {tx.review.reviewedBy || 'Admin'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {tx.status === 'PENDING' ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ gap: '4px', padding: '6px 12px' }}
                            onClick={() => handleOpenDetailModal(tx)}
                          >
                            <ShieldAlert size={13} />
                            <span>Resolve</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ gap: '4px', padding: '6px 12px' }}
                            onClick={() => handleOpenDetailModal(tx)}
                          >
                            <span>Inspect</span>
                            <ChevronRight size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Forensic Details & Admin Review Modal */}
      {selectedTx && (
        <Modal
          isOpen={Boolean(selectedTx)}
          onClose={handleCloseDetailModal}
          title={`Transaction Audit: #${selectedTx.transactionId}`}
          subtitle={`${selectedTx.customerName} • ${formatDateTime(selectedTx.transactionTime || selectedTx.createdAt)}`}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Diagnosis / Error Status Banner */}
            {selectedTx.diagnosis?.code === 'PENDING_ERROR' && (
              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'rgba(234, 88, 12, 0.1)',
                  border: '1px solid rgba(234, 88, 12, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                <AlertTriangle size={20} color="#EA580C" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#EA580C', fontSize: '14px' }}>
                    Pending Due to Analysis / ML Service Anomaly
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.4 }}>
                    The transaction was initiated, but the automated fraud detection service was either unreachable or encountered a timeout. The transaction remains safely held in <strong>PENDING</strong> status. Funds have not been finalized.
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    You can approve this transaction below to clear the hold and update the customer's balance, or reject it with an audit note.
                  </div>
                </div>
              </div>
            )}

            {selectedTx.diagnosis?.code === 'PENDING_ALERT' && (
              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                <ShieldAlert size={20} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-warning)', fontSize: '14px' }}>
                    High-Risk Security Hold: Sentinel AI Flag
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {selectedTx.fraudAlert?.reason || 'Transaction flagged due to abnormal risk signals.'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Severity: <strong>{selectedTx.fraudAlert?.severity || 'HIGH'}</strong> • Awaiting compliance officer resolution.
                  </div>
                </div>
              </div>
            )}

            {selectedTx.review && (
              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                <ShieldCheck size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                    Audit History: {selectedTx.review.decision} by {selectedTx.review.reviewedBy || 'Admin'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    "{selectedTx.review.reason || 'No audit comments provided.'}"
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Logged on {formatDateTime(selectedTx.review.reviewedAt)}
                  </div>
                </div>
              </div>
            )}

            {/* Financial Overview Card */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                backgroundColor: 'var(--bg-card-subtle)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Amount</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatINR(selectedTx.amount)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Transaction Type</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span className="badge badge-neutral">{selectedTx.transactionType}</span>
                  <StatusBadge status={selectedTx.status} />
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Merchant / Counterparty</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedTx.merchant || 'Internal Transfer'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Timestamp</span>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {formatDateTime(selectedTx.transactionTime || selectedTx.createdAt)}
                </div>
              </div>
            </div>

            {/* Customer & Account Details */}
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}
            >
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} color="var(--primary)" />
                <span>Customer Account Dossier</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Customer Name</span>
                  <div style={{ fontWeight: 600 }}>{selectedTx.customerName}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Account Number</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                    {selectedTx.accountNumber} ({selectedTx.accountType || 'SAVINGS'})
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Contact Phone</span>
                  <div>{selectedTx.customerPhone}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Current Account Balance</span>
                  <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                    {formatINR(selectedTx.currentAccountBalance)}
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry (Device & Location) */}
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}
            >
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Smartphone size={15} color="var(--primary)" />
                <span>Device & Telemetry Fingerprint</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Device Profile</span>
                  <div>
                    {selectedTx.device
                      ? `${selectedTx.device.deviceType || 'Web'} • ${selectedTx.device.os || 'Windows'}`
                      : 'Web Browser'}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>IP & Trust Status</span>
                  <div>
                    {selectedTx.device?.ipAddress || '127.0.0.1'} •{' '}
                    <span style={{ color: selectedTx.device?.isTrusted ? 'var(--color-success)' : 'var(--text-muted)' }}>
                      {selectedTx.device?.isTrusted ? 'Trusted Device' : 'New Device'}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Resolved Location</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} color="var(--text-muted)" />
                    <span>
                      {selectedTx.location
                        ? `${selectedTx.location.city}, ${selectedTx.location.country}`
                        : 'Local Simulated Node, India'}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>ML Risk Score</span>
                  <div style={{ fontWeight: 600 }}>
                    {selectedTx.fraudPrediction
                      ? `${selectedTx.fraudPrediction.riskScore}/100 (${selectedTx.fraudPrediction.riskLevel})`
                      : 'No ML score recorded (Hold)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Administrative Resolution Form (Only if transaction is PENDING) */}
            {selectedTx.status === 'PENDING' && (
              <div
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Administrative Resolution
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Resolve this held transaction. Approving will update the customer's balance.
                  </p>
                </div>

                {/* Quick Presets */}
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Quick Reason Templates:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      'System timeout recovered - customer authorized',
                      'Customer identity verified via telephone',
                      'Legitimate verified transaction',
                      'Unusual device flagged - rejected for customer safety',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => setReviewReason(preset)}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-reason-textarea"
                    style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}
                  >
                    Resolution Audit Note:
                  </label>
                  <textarea
                    id="admin-reason-textarea"
                    className="form-textarea"
                    rows={2}
                    placeholder="Enter compliance decision rationale for the immutable audit log..."
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseDetailModal}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ gap: '6px' }}
                    onClick={handleReject}
                    disabled={actionLoading}
                  >
                    <XCircle size={15} />
                    <span>Reject Transaction</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ gap: '6px' }}
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <LoadingSpinner size="sm" /> : <CheckCircle2 size={15} />}
                    <span>Approve & Clear Hold</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminTransactions;
