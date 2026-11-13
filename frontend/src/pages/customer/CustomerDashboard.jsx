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
  Eye,
  EyeOff,
  Wifi,
  Sparkles,
  ArrowUpRight,
  PlusCircle,
  Copy,
  Check,
} from 'lucide-react';

export const CustomerDashboard = () => {
  const { user } = useAuth();

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

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

  const handleCopyAccount = () => {
    if (!account?.accountNumber) return;
    navigator.clipboard.writeText(String(account.accountNumber));
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

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
      {/* Welcome & Live Telemetry Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              SENTINEL AI ACTIVE
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              MNNIT Distributed Ledger
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
            {getGreeting()}, {firstName}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Account overview, continuous fraud surveillance, and real-time ledger telemetry.
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
            <span>Sync</span>
          </button>

          <Link to="/make-transaction" className="btn btn-primary">
            <Send size={15} />
            <span>Send Money</span>
          </Link>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* Apple Titanium Card Banner */}
          <div
            className="apple-glass-card"
            style={{
              padding: 'clamp(24px, 4vw, 36px)',
              marginBottom: '28px',
              background:
                'linear-gradient(135deg, #0b1120 0%, #0f172a 45%, #1e293b 85%, #1e3a8a 100%)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow:
                '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '24px',
            }}
          >
            {/* Specular Titanium Sheen Accent */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '600px',
                height: '100%',
                background:
                  'radial-gradient(circle at 85% 20%, rgba(56, 189, 248, 0.18) 0%, rgba(99, 102, 241, 0.08) 45%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Subtle Diagonal Guilloche Hairline Pattern */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.04,
                backgroundImage:
                  'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 24px)',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '28px',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Left Column: Account Details & Balance */}
              <div style={{ flex: '1 1 320px', minWidth: '260px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(8px)',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#93C5FD',
                    }}
                  >
                    <Building size={12} />
                    <span>{account?.accountType || 'Savings'} Account</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      transition: 'color 0.2s',
                    }}
                    title="Copy Account Number"
                  >
                    <span>{maskAccountNumber(account?.accountNumber)}</span>
                    {copiedAccount ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#94a3b8',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Available Balance
                  </span>

                  <button
                    type="button"
                    onClick={() => setHideBalance(!hideBalance)}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '999px',
                      padding: '2px 8px',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title={hideBalance ? 'Show Balance' : 'Hide Balance'}
                  >
                    {hideBalance ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span>{hideBalance ? 'Show' : 'Hide'}</span>
                  </button>
                </div>

                <div
                  style={{
                    fontSize: 'clamp(32px, 5.5vw, 46px)',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                    fontFeatureSettings: '"tnum"',
                    color: '#ffffff',
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  }}
                >
                  {loading ? (
                    <div
                      className="skeleton"
                      style={{
                        width: '220px',
                        height: '46px',
                        backgroundColor: 'rgba(255,255,255,0.12)',
                        borderRadius: '12px',
                      }}
                    />
                  ) : hideBalance ? (
                    '••••••••'
                  ) : (
                    formatINR(account?.balance ?? 0)
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginTop: '16px',
                    fontSize: '12px',
                    color: '#cbd5e1',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={15} color="#34d399" />
                    <span>Real-time ML Surveillance</span>
                  </span>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Wifi size={13} color="#38bdf8" />
                    <span>Zero-Knowledge Fast Path</span>
                  </span>
                </div>
              </div>

              {/* Right Column: Titanium Mini-Card Visual Preview + Action Pills */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '14px',
                }}
              >
                {/* Physical Titanium Card Simulation Pill */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '18px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                    minWidth: '240px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        color: '#38bdf8',
                      }}
                    >
                      TRUSTPAY SENTINEL
                    </span>
                    <Wifi size={14} color="#94a3b8" />
                  </div>

                  {/* EMV Microchip graphic */}
                  <div
                    style={{
                      width: '32px',
                      height: '24px',
                      borderRadius: '5px',
                      background: 'linear-gradient(135deg, #fcd34d 0%, #b45309 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4)',
                      marginBottom: '12px',
                    }}
                  />

                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      letterSpacing: '0.15em',
                      color: '#f8fafc',
                    }}
                  >
                    •••• •••• •••• {account?.accountNumber ? String(account.accountNumber).slice(-4) : '4291'}
                  </div>
                </div>

                {/* Primary Quick Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <Link
                    to="/make-transaction"
                    className="btn btn-primary"
                    style={{
                      flex: 1,
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A !important',
                      fontWeight: 700,
                      boxShadow: '0 4px 14px rgba(255,255,255,0.25)',
                    }}
                  >
                    <Send size={15} color="#0F172A" />
                    <span style={{ color: '#0F172A' }}>Send Money</span>
                  </Link>

                  <Link
                    to="/transactions"
                    className="btn btn-secondary"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      borderColor: 'rgba(255,255,255,0.2)',
                      color: '#ffffff',
                    }}
                  >
                    <span>History</span>
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
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
              value={hideBalance ? '••••••' : formatINR(account?.balance ?? 0)}
              subtitle="Primary checking & savings"
              icon={Wallet}
              iconBg="var(--primary-light)"
              iconColor="var(--primary)"
              loading={loading}
            />

            <StatCard
              title="Total Transactions"
              value={totalTxCount}
              subtitle="Surveilled by Sentinel AI"
              icon={CreditCard}
              iconBg="var(--bg-card-subtle)"
              iconColor="var(--navy)"
              loading={loading}
            />

            <StatCard
              title="Passed Security"
              value={approvedTxCount}
              subtitle="Zero-threat fast path"
              icon={CheckCircle2}
              iconBg="var(--color-success-bg)"
              iconColor="var(--color-success)"
              loading={loading}
            />

            <StatCard
              title="Pending Verification"
              value={pendingTxCount}
              subtitle={pendingTxCount > 0 ? 'Under security verification' : 'Queue cleared'}
              icon={Clock}
              iconBg={pendingTxCount > 0 ? 'var(--color-warning-bg)' : 'var(--bg-card-subtle)'}
              iconColor={pendingTxCount > 0 ? 'var(--color-warning)' : 'var(--text-muted)'}
              loading={loading}
            />
          </div>

          {/* Recent Transactions Section */}
          <div className="card" style={{ padding: 'clamp(20px, 3.5vw, 28px)' }}>
            <div className="card-header">
              <div>
                <h2 className="card-title">Recent Transactions</h2>
                <p className="card-subtitle">
                  Real-time ledger events and cryptographic evaluation results
                </p>
              </div>

              <Link
                to="/transactions"
                className="btn btn-ghost btn-sm"
                style={{ gap: '6px', fontWeight: 600 }}
              >
                <span>View all activity</span>
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
                padding: '18px',
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Amount</div>
                <div
                  style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {formatINR(selectedTx.amount)}
                </div>
              </div>
              <StatusBadge status={selectedTx.status} />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                fontSize: '13px',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Merchant / Counterparty
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedTx.merchant || '—'}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Type</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedTx.transaction_type}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Account</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedTx.account_number || account?.accountNumber || '—'}
                </div>
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
                  padding: '14px 16px',
                  backgroundColor: 'var(--color-warning-bg)',
                  border: '1px solid var(--color-warning-border)',
                  borderRadius: '14px',
                  fontSize: '13px',
                  color: 'var(--color-warning)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <Clock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Under Security Review:</strong> Our monitoring system flagged this
                  transaction for additional verification. An administrator is reviewing it.
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
