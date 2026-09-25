import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { formatINR } from '../../utils/formatting';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import CreditAccountModal from '../../components/CreditAccountModal';
import {
  Building,
  Search,
  PlusCircle,
  RefreshCw,
  Mail,
  Phone,
  Receipt,
} from 'lucide-react';

export const AdminAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedAccountForCredit, setSelectedAccountForCredit] = useState(null);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getAllAccounts();
      if (res && res.accounts) {
        setAccounts(res.accounts);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
      setError('Unable to load customer accounts from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = accounts.filter((acc) => {
    const term = search.toLowerCase();
    return (
      !term ||
      (acc.customerName && acc.customerName.toLowerCase().includes(term)) ||
      (acc.accountNumber && acc.accountNumber.toLowerCase().includes(term)) ||
      (acc.email && acc.email.toLowerCase().includes(term)) ||
      (acc.phone && acc.phone.includes(term))
    );
  });

  const totalBalance = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  const avgBalance = accounts.length > 0 ? totalBalance / accounts.length : 0;

  const handleOpenCreditModal = (account = null) => {
    setSelectedAccountForCredit(account);
    setIsCreditModalOpen(true);
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
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Account & Balance Management</h1>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>
            Inspect customer savings balances and deposit funds directly into accounts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchAccounts}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => handleOpenCreditModal(null)}
          >
            <PlusCircle size={15} />
            <span>Credit Account</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
          marginBottom: '24px',
        }}
      >
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Total Customer Deposits
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatINR(totalBalance)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Across all active accounts
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Active Accounts
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>
            {accounts.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Provisioned savings accounts
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Average Account Balance
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)' }}>
            {formatINR(avgBalance)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Liquidity per customer
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '20px', maxWidth: '380px', position: 'relative' }}>
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
          placeholder="Search by customer, account #, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '36px' }}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchAccounts} />
      ) : (
        <div className="card" style={{ padding: '24px' }}>
          {filteredAccounts.length === 0 ? (
            <EmptyState
              icon={Building}
              title={accounts.length === 0 ? 'No accounts provisioned' : 'No accounts match search'}
              message="Customer accounts will be listed here once registered."
            />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Account Number</th>
                    <th>Customer Name</th>
                    <th>Contact Info</th>
                    <th>Account Type</th>
                    <th style={{ textAlign: 'right' }}>Current Balance</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.accountId}>
                      <td>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            fontSize: '13px',
                          }}
                        >
                          {acc.accountNumber}
                        </span>
                      </td>

                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {acc.customerName}
                      </td>

                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={12} color="var(--text-muted)" />
                            <span>{acc.email}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} color="var(--text-muted)" />
                            <span>{acc.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="badge badge-neutral">
                          {acc.accountType || 'SAVINGS'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '15px',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {formatINR(acc.balance)}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <Link
                            to={`/admin/transactions?customerId=${acc.userId}`}
                            className="btn btn-secondary btn-sm"
                            style={{ gap: '6px' }}
                            title={`View transactions for account ${acc.accountNumber}`}
                          >
                            <Receipt size={14} color="var(--primary)" />
                            <span>Transactions</span>
                          </Link>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ gap: '6px' }}
                            onClick={() => handleOpenCreditModal(acc)}
                          >
                            <PlusCircle size={14} color="var(--primary)" />
                            <span>Add Funds</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Credit Account Modal */}
      <CreditAccountModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        initialAccount={selectedAccountForCredit}
        onSuccess={() => {
          fetchAccounts();
        }}
      />
    </div>
  );
};

export default AdminAccounts;
