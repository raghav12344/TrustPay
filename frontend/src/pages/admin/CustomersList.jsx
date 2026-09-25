import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { formatINR } from '../../utils/formatting';
import EmptyState from '../../components/EmptyState';
import CreditAccountModal from '../../components/CreditAccountModal';
import { Users, Search, Phone, Mail, PlusCircle, RefreshCw, Receipt } from 'lucide-react';

export const CustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllAccounts();
      if (res && res.accounts) {
        setCustomers(res.accounts);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      (c.customerName && c.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.accountNumber && c.accountNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenCredit = (cust = null) => {
    setSelectedCustomer(cust);
    setIsCreditModalOpen(true);
  };

  return (
    <div>
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
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Customer Directory</h1>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>
            Registered customers, assigned account numbers, and current liquidity.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchCustomers}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => handleOpenCredit(null)}
          >
            <PlusCircle size={15} />
            <span>Credit Account</span>
          </button>
        </div>
      </div>

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
          placeholder="Search by name, email, account #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '36px' }}
        />
      </div>

      <div className="card" style={{ padding: '24px' }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={customers.length === 0 ? 'No customers registered' : 'No matches found'}
            message="Registered accounts will be displayed in this directory."
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact Info</th>
                  <th>Account Number</th>
                  <th>Account Type</th>
                  <th style={{ textAlign: 'right' }}>Current Balance</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.accountId}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {c.customerName}
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Mail size={12} color="var(--text-muted)" />
                          <span>{c.email}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Phone size={12} color="var(--text-muted)" />
                          <span>{c.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
                        {c.accountNumber}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {c.accountType || 'SAVINGS'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {formatINR(c.balance)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Link
                          to={`/admin/transactions?customerId=${c.userId}`}
                          className="btn btn-secondary btn-sm"
                          style={{ gap: '6px' }}
                          title={`View transactions for ${c.customerName}`}
                        >
                          <Receipt size={14} color="var(--primary)" />
                          <span>Transactions</span>
                        </Link>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ gap: '6px' }}
                          onClick={() => handleOpenCredit(c)}
                        >
                          <PlusCircle size={14} color="var(--primary)" />
                          <span>Credit</span>
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

      {/* Credit Account Modal */}
      <CreditAccountModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        initialAccount={selectedCustomer}
        onSuccess={() => {
          fetchCustomers();
        }}
      />
    </div>
  );
};

export default CustomersList;
