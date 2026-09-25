import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import adminService from '../services/adminService';
import { formatINR } from '../utils/formatting';
import { useToast } from '../context/ToastContext';
import { Loader2, PlusCircle, Building, AlertCircle } from 'lucide-react';

export const CreditAccountModal = ({
  isOpen,
  onClose,
  initialAccount = null,
  onSuccess = null,
}) => {
  const { success, error: toastError } = useToast();

  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setRemarks('');
      setFormError('');

      if (initialAccount) {
        setSelectedAccountId(String(initialAccount.accountId || initialAccount.account_id || ''));
      } else {
        setSelectedAccountId('');
      }

      // Fetch all customer accounts
      const loadAccounts = async () => {
        try {
          setLoadingAccounts(true);
          const data = await adminService.getAllAccounts();
          if (data && data.accounts) {
            setAccounts(data.accounts);
            if (!initialAccount && data.accounts.length > 0) {
              setSelectedAccountId(String(data.accounts[0].accountId));
            }
          }
        } catch (err) {
          console.error('Failed to load accounts for deposit modal:', err);
        } finally {
          setLoadingAccounts(false);
        }
      };

      loadAccounts();
    }
  }, [isOpen, initialAccount]);

  const selectedAccount = accounts.find(
    (a) => String(a.accountId) === String(selectedAccountId)
  ) || initialAccount;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedAccountId) {
      setFormError('Please select a target account.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid credit amount greater than zero.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      const result = await adminService.depositToAccount({
        accountId: selectedAccountId,
        amount: numAmount,
        remarks: remarks || 'Admin Balance Credit',
      });

      success(`Successfully credited ${formatINR(numAmount)} to account ${result.accountNumber || ''}`);

      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (err) {
      console.error('Admin deposit failed:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to deposit funds.';
      setFormError(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !submitting && onClose()}
      title="Credit Customer Account"
      subtitle="Directly credit funds to a customer balance with an approved audit record"
      maxWidth="500px"
    >
      <form onSubmit={handleSubmit}>
        {formError && (
          <div
            className="animate-fade-in"
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-danger)',
              fontSize: '13px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} flexShrink={0} />
            <span>{formError}</span>
          </div>
        )}

        {/* Account Selector */}
        <div className="form-group">
          <label className="form-label" htmlFor="targetAccount">
            Select Customer Account <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          {loadingAccounts ? (
            <div className="skeleton" style={{ height: '42px', width: '100%', borderRadius: 'var(--radius-md)' }} />
          ) : (
            <select
              id="targetAccount"
              className="form-select"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              disabled={submitting || Boolean(initialAccount)}
            >
              {accounts.map((acc) => (
                <option key={acc.accountId} value={acc.accountId}>
                  {acc.customerName} — {acc.accountNumber} ({formatINR(acc.balance)})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Account Summary Banner */}
        {selectedAccount && (
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedAccount.customerName || 'Customer'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {selectedAccount.accountNumber}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current Balance</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatINR(selectedAccount.balance ?? 0)}
              </div>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="creditAmount">
            Credit Amount (INR ₹) <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontWeight: 700,
                fontSize: '16px',
                color: 'var(--text-secondary)',
              }}
            >
              ₹
            </span>
            <input
              id="creditAmount"
              type="number"
              step="0.01"
              min="1"
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '16px', fontWeight: 600 }}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={submitting}
              autoFocus
            />
          </div>
          {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && selectedAccount && (
            <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '4px', fontWeight: 500 }}>
              New balance will be: {formatINR((Number(selectedAccount.balance) || 0) + parseFloat(amount))}
            </div>
          )}
        </div>

        {/* Remarks / Justification */}
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label className="form-label" htmlFor="depositRemarks">
            Audit Remarks / Reference Note
          </label>
          <input
            id="depositRemarks"
            type="text"
            className="form-input"
            placeholder="e.g. Branch deposit, Welcome bonus, Dispute adjustment"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={submitting}
          />
          <div className="form-hint">
            This note will be recorded in the customer's transaction history.
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !amount}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Crediting...</span>
              </>
            ) : (
              <>
                <PlusCircle size={16} />
                <span>Credit Account</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreditAccountModal;
