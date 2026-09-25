import React, { useState, useEffect } from 'react';
import transactionService from '../../services/transactionService';
import TransactionTable from '../../components/TransactionTable';
import ErrorState from '../../components/ErrorState';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { formatINR, formatDateTime } from '../../utils/formatting';
import { RefreshCw, Clock, ShieldCheck, Copy, Check } from 'lucide-react';

export const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await transactionService.getCustomerTransactions();
      if (res && res.transactions) {
        setTransactions(res.transactions);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Unable to load transaction records. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
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
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Transaction History</h1>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>
            Complete audit trail of all incoming and outgoing account movements.
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
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchTransactions} />
      ) : (
        <div className="card" style={{ padding: '24px' }}>
          <TransactionTable
            transactions={transactions}
            loading={loading}
            showSearch={true}
            showFilters={true}
            onSelectTransaction={(tx) => setSelectedTx(tx)}
          />
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTx && (
        <Modal
          isOpen={Boolean(selectedTx)}
          onClose={() => setSelectedTx(null)}
          title="Transaction Details"
          subtitle={`Reference #${selectedTx.transaction_id}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Amount Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px',
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Total Amount
                </div>
                <div
                  style={{
                    fontSize: '28px',
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

            {/* Information Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                fontSize: '13px',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Transaction ID</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    #{selectedTx.transaction_id}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyId(selectedTx.transaction_id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: '2px',
                    }}
                    title="Copy Transaction ID"
                  >
                    {copiedId ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Transaction Type</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedTx.transaction_type}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Merchant / Payee</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedTx.merchant || 'General Transaction'}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Account Reference</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedTx.account_number || 'Primary Savings'}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Timestamp</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDateTime(selectedTx.transaction_time)}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Security Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <ShieldCheck size={15} color="var(--color-success)" />
                  <span>Verified Telemetry</span>
                </div>
              </div>
            </div>

            {/* High/Pending explanation */}
            {selectedTx.status === 'PENDING' && (
              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'var(--color-warning-bg)',
                  border: '1px solid var(--color-warning-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  color: 'var(--color-warning)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <Clock size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Under Security Review:</strong> Our continuous security algorithm flagged this transaction for additional verification. An operations specialist will resolve it shortly.
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

export default Transactions;
