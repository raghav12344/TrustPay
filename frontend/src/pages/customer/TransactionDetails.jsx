import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import transactionService from '../../services/transactionService';
import { formatINR, formatDateTime } from '../../utils/formatting';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import { ArrowLeft, Clock, Copy, Check } from 'lucide-react';

export const TransactionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await transactionService.getCustomerTransactions();
        if (data && data.transactions) {
          const found = data.transactions.find((t) => String(t.transaction_id) === String(id));
          if (found) {
            setTransaction(found);
          } else {
            setError(`Transaction #${id} not found.`);
          }
        }
      } catch (err) {
        console.error('Error fetching transaction:', err);
        setError('Failed to load transaction information.');
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, [id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Retrieving transaction details..." />;
  }

  if (error || !transaction) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => navigate('/transactions')}
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: '16px', gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Transactions</span>
        </button>
        <ErrorState
          title="Transaction Not Found"
          message={error || `Could not find transaction #${id}`}
          onRetry={() => navigate('/transactions')}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => navigate('/transactions')}
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: '16px', gap: '6px' }}
      >
        <ArrowLeft size={16} />
        <span>Back to Transactions</span>
      </button>

      <div className="card" style={{ padding: '32px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '24px',
          }}
        >
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Transaction Reference
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                #{transaction.transaction_id}
              </h1>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                }}
                title="Copy Transaction ID"
              >
                {copied ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <StatusBadge status={transaction.status} />
        </div>

        {/* Amount display */}
        <div
          style={{
            padding: '24px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card-subtle)',
            textAlign: 'center',
            marginBottom: '28px',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Transaction Amount
          </div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            {formatINR(transaction.amount)}
          </div>
        </div>

        {/* Details List */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            fontSize: '14px',
            marginBottom: '28px',
          }}
        >
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>
              Merchant / Recipient
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {transaction.merchant || 'General Payment'}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>
              Transaction Type
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {transaction.transaction_type}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>
              Source Account
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {transaction.account_number || 'Primary Savings'}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>
              Execution Timestamp
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatDateTime(transaction.transaction_time)}
            </div>
          </div>
        </div>

        {transaction.status === 'PENDING' && (
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-warning-bg)',
              border: '1px solid var(--color-warning-border)',
              color: 'var(--color-warning)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <Clock size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Security Hold:</strong> This transaction was flagged for manual verification by our automated fraud detection system. An admin specialist is reviewing the authorization.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionDetails;
