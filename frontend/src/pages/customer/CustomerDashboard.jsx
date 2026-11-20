import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import accountService from '../../services/accountService';
import transactionService from '../../services/transactionService';
import { formatINR, maskAccountNumber } from '../../utils/formatting';
import StatCard from '../../components/StatCard';
import TransactionTable from '../../components/TransactionTable';
import ErrorState from '../../components/ErrorState';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import {
  Wallet,
  ArrowRight,
  Clock,
  CheckCircle2,
  Send,
  ShieldCheck,
  CreditCard,
  Building,
  RefreshCw,
} from 'lucide-react';

export const CustomerDashboard = () => {
  const { user } = useAuth();

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [accRes, txRes] = await Promise.all([
        accountService.getMyAccount().catch((err) => {
          console.error('Account fetch error:', err);
          return null;
        }),
        transactionService.getCustomerTransactions().catch((err) => {
          console.error('Transactions fetch error:', err);
          return null;
        }),
      ]);

      if (accRes && accRes.account) {
        setAccount(accRes.account);
      }
      if (txRes && txRes.transactions) {
        setTransactions(txRes.transactions);
      }
    } catch (err) {
      console.error('Dashboard data error:', err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Valued Customer';

  // Metrics computation from real backend data
  const totalTxCount = transactions.length;
  const approvedTxCount = transactions.filter(
    (t) => (t.status || '').toUpperCase() === 'APPROVED'
  ).length;
  const pendingTxCount = transactions.filter(
    (t) => (t.status || '').toUpperCase() === 'PENDING'
  ).length;

  return (
    <div>
      {/* Welcome Section */}
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
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>
            {getGreeting()}, {firstName}
          </h1>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>
            Here is your financial activity overview and real-time security telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <Link to="/make-transaction" className="btn btn-primary">
            <Send size={16} />
            <span>Make Transaction</span>
          </Link>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* Main Account Card Banner */}
          <div
            className="card"
            style={{
              padding: 'clamp(20px, 4vw, 32px)',
              marginBottom: '28px',
              background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #1D4ED8 100%)',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.4)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle background decoration */}
            <div
              style={{
                position: 'absolute',
                right: '-30px',
                top: '-30px',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '24px',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#93C5FD',
                    marginBottom: '8px',
                  }}
                >
                  <Building size={14} />
                  <span>{account?.accountType || 'Savings'} Account</span>
                  <span>•</span>
                  <span>{maskAccountNumber(account?.accountNumber)}</span>
                </div>

                <div
                  style={{
                    fontSize: '13px',
                    color: '#CBD5E1',
                    marginBottom: '6px',
                  }}
                >
                  Available Balance
                </div>

                <div
                  style={{
                    fontSize: 'clamp(26px, 5.5vw, 36px)',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                  }}
                >
                  {loading ? (
                    <div
                      className="skeleton"
                      style={{
                        width: '200px',
                        height: '42px',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                      }}
                    />
                  ) : (
                    formatINR(account?.balance ?? 0)
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(4px)',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  <ShieldCheck size={14} color="#6EE7B7" />
                  <span>AI Fraud Shield Active</span>
                </div>

                <Link
                  to="/make-transaction"
                  className="btn"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#1D4ED8',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  <Send size={16} />
                  <span>Send Money</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Stat Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '18px',
              marginBottom: '32px',
            }}
          >
            <StatCard
              title="Current Balance"
              value={formatINR(account?.balance ?? 0)}
              subtitle="Primary account"
              icon={Wallet}
              iconBg="var(--primary-light)"
              iconColor="var(--primary)"
              loading={loading}
            />

            <StatCard
              title="Total Transactions"
              value={totalTxCount}
              subtitle="All historical records"
              icon={CreditCard}
              iconBg="var(--bg-card-subtle)"
              iconColor="var(--navy)"
              loading={loading}
            />

            <StatCard
              title="Approved Transactions"
              value={approvedTxCount}
              subtitle="Passed security checks"
              icon={CheckCircle2}
              iconBg="var(--color-success-bg)"
              iconColor="var(--color-success)"
              loading={loading}
            />

            <StatCard
              title="Pending Reviews"
              value={pendingTxCount}
              subtitle={pendingTxCount > 0 ? 'Under security verification' : 'No active holds'}
              icon={Clock}
              iconBg={pendingTxCount > 0 ? 'var(--color-warning-bg)' : 'var(--bg-card-subtle)'}
              iconColor={pendingTxCount > 0 ? 'var(--color-warning)' : 'var(--text-muted)'}
              loading={loading}
            />
          </div>

          {/* Recent Transactions Section */}
          <div className="card" style={{ padding: '24px' }}>
            <div className="card-header">
              <div>
                <h2 className="card-title">Recent Transactions</h2>
                <p className="card-subtitle">Your latest account movements</p>
              </div>

              <Link
                to="/transactions"
                className="btn btn-ghost btn-sm"
                style={{ gap: '6px', fontWeight: 600 }}
              >
                <span>View all</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            <TransactionTable
              transactions={transactions}
              loading={loading}
              limit={5}
              showSearch={false}
              showFilters={false}
              onSelectTransaction={(tx) => setSelectedTx(tx)}
            />
          </div>
        </>
      )}

      {/* Quick Transaction Detail Modal */}
      {selectedTx && (
        <Modal
          isOpen={Boolean(selectedTx)}
          onClose={() => setSelectedTx(null)}
          title="Transaction Details"
          subtitle={`Reference ID #${selectedTx.transaction_id}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Amount</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatINR(selectedTx.amount)}
                </div>
              </div>
              <StatusBadge status={selectedTx.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Merchant / Counterparty</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedTx.merchant || '—'}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Type</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedTx.transaction_type}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Account</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedTx.account_number || account?.accountNumber || '—'}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Date & Time</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {new Date(selectedTx.transaction_time).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {selectedTx.status === 'PENDING' && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-warning-bg)',
                  border: '1px solid var(--color-warning-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  color: 'var(--color-warning)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <Clock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Under Security Review:</strong> Our monitoring system flagged this transaction for additional verification. An administrator is reviewing it.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedTx(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomerDashboard;
