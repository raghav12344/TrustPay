import React, { useState, useMemo } from 'react';
import { formatINR, formatDateTime } from '../utils/formatting';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';
import TransactionCard, { getTransactionIcon } from './TransactionCard';
import { Search, Filter } from 'lucide-react';

export const TransactionTable = ({
  transactions = [],
  loading = false,
  onSelectTransaction = null,
  showSearch = true,
  showFilters = true,
  limit = null,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      // Search filter
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        String(tx.transaction_id).includes(term) ||
        (tx.merchant && tx.merchant.toLowerCase().includes(term)) ||
        (tx.transaction_type && tx.transaction_type.toLowerCase().includes(term)) ||
        (tx.account_number && tx.account_number.toLowerCase().includes(term));

      // Status filter
      const matchStatus =
        statusFilter === 'ALL' ||
        (tx.status && tx.status.toUpperCase() === statusFilter);

      // Type filter
      const matchType =
        typeFilter === 'ALL' ||
        (tx.transaction_type && tx.transaction_type.toUpperCase() === typeFilter);

      return matchSearch && matchStatus && matchType;
    });
  }, [transactions, searchTerm, statusFilter, typeFilter]);

  const displayedTransactions = limit ? filtered.slice(0, limit) : filtered;

  if (loading) {
    return (
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ width: '100%', height: '52px', borderRadius: 'var(--radius-md)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Controls: Search & Filters */}
      {(showSearch || showFilters) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          {showSearch && (
            <div
              style={{
                position: 'relative',
                flex: '1 1 240px',
                maxWidth: '380px',
              }}
            >
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
                placeholder="Search transactions by merchant, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>
          )}

          {showFilters && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={14} color="var(--text-secondary)" />
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
              >
                <option value="ALL">All Types</option>
                <option value="PAYMENT">Payment</option>
                <option value="TRANSFER">Transfer</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="DEPOSIT">Deposit</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {displayedTransactions.length === 0 ? (
        <EmptyState
          title={transactions.length === 0 ? 'No transactions yet' : 'No transactions match filters'}
          message={
            transactions.length === 0
              ? 'Once you start making transactions, they will appear here.'
              : 'Try clearing your search query or changing filter settings.'
          }
        />
      ) : (
        <>
          {/* Desktop & Tablet Table View (>= 768px) */}
          <div className="table-container desktop-table-view">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date & Time</th>
                  <th>Merchant / Details</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedTransactions.map((tx) => {
                  const isPositive = (tx.transaction_type || '').toUpperCase() === 'DEPOSIT';
                  return (
                    <tr
                      key={tx.transaction_id}
                      onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                      style={{
                        cursor: onSelectTransaction ? 'pointer' : 'default',
                      }}
                    >
                      <td>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--primary)',
                          }}
                        >
                          #{tx.transaction_id}
                        </span>
                      </td>

                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDateTime(tx.transaction_time)}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--bg-card-subtle)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {getTransactionIcon(tx.transaction_type)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {tx.merchant || 'General Transaction'}
                            </div>
                            {tx.account_number && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {tx.account_number}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-card-subtle)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {tx.transaction_type}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '14px',
                            color: isPositive ? 'var(--color-success)' : 'var(--text-primary)',
                          }}
                        >
                          {isPositive ? '+' : ''}{formatINR(tx.amount)}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <StatusBadge status={tx.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (< 768px) */}
          <div className="mobile-cards-view">
            {displayedTransactions.map((tx) => (
              <TransactionCard
                key={tx.transaction_id}
                transaction={tx}
                onClick={onSelectTransaction ? () => onSelectTransaction(tx) : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionTable;
