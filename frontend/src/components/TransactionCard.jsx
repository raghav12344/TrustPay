import React from 'react';
import { formatINR, formatDateTime } from '../utils/formatting';
import StatusBadge from './StatusBadge';
import { ArrowUpRight, ArrowDownLeft, CreditCard, RefreshCw, ChevronRight } from 'lucide-react';

export const getTransactionIcon = (type) => {
  const norm = (type || '').toUpperCase();
  switch (norm) {
    case 'PAYMENT':
      return <CreditCard size={18} />;
    case 'TRANSFER':
      return <RefreshCw size={18} />;
    case 'WITHDRAWAL':
      return <ArrowUpRight size={18} />;
    case 'DEPOSIT':
      return <ArrowDownLeft size={18} />;
    default:
      return <CreditCard size={18} />;
  }
};

export const TransactionCard = ({ transaction, onClick }) => {
  const {
    merchant,
    transaction_type,
    amount,
    status,
    transaction_time,
  } = transaction;

  const isPositive = (transaction_type || '').toUpperCase() === 'DEPOSIT';

  return (
    <div
      onClick={onClick}
      className="card"
      style={{
        padding: '16px',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: isPositive ? 'var(--color-success-bg)' : 'var(--bg-card-subtle)',
            color: isPositive ? 'var(--color-success)' : 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {getTransactionIcon(transaction_type)}
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {merchant || transaction_type || 'Transaction'}
          </div>

          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginTop: '2px',
            }}
          >
            {formatDateTime(transaction_time)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: isPositive ? 'var(--color-success)' : 'var(--text-primary)',
            }}
          >
            {isPositive ? '+' : ''}{formatINR(amount)}
          </div>
          <div style={{ marginTop: '4px' }}>
            <StatusBadge status={status} />
          </div>
        </div>

        {onClick && (
          <ChevronRight size={18} color="var(--text-muted)" />
        )}
      </div>
    </div>
  );
};

export default TransactionCard;
