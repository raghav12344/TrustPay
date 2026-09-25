import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this data.',
  onRetry = null,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 24px',
        backgroundColor: 'var(--color-danger-bg)',
        border: '1px solid var(--color-danger-border)',
        borderRadius: 'var(--radius-lg)',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'rgba(220, 38, 38, 0.12)',
          color: 'var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
        }}
      >
        <AlertCircle size={24} />
      </div>

      <h3
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '6px',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          maxWidth: '400px',
          lineHeight: 1.5,
          marginBottom: onRetry ? '18px' : '0',
        }}
      >
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn btn-secondary btn-sm"
          style={{ gap: '6px' }}
        >
          <RefreshCw size={14} />
          <span>Try again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
