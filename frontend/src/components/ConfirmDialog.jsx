import React, { useState } from 'react';
import Modal from './Modal';
import { Loader2 } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmType = 'primary', // 'primary' | 'danger' | 'success'
  requireReason = false,
  reasonPlaceholder = 'Please enter a justification for this decision...',
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (requireReason && !reason.trim()) {
      setReasonError('Reason is required to proceed');
      return;
    }
    setReasonError('');
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setReasonError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="480px">
      <form onSubmit={handleSubmit}>
        {message && (
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: requireReason ? '18px' : '24px',
            }}
          >
            {message}
          </p>
        )}

        {requireReason && (
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">
              Reason / Audit Notes <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <textarea
              className={`form-textarea ${reasonError ? 'error' : ''}`}
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setReasonError('');
              }}
              placeholder={reasonPlaceholder}
              disabled={loading}
              autoFocus
            />
            {reasonError && <div className="form-error">{reasonError}</div>}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className={`btn btn-${confirmType}`}
            disabled={loading || (requireReason && !reason.trim())}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ConfirmDialog;
