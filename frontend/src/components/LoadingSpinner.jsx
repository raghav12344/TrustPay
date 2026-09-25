import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 20, text = null, color = 'var(--primary)', fullPage = false }) => {
  const content = (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      <Loader2
        size={size}
        className="animate-spin"
        style={{ color, flexShrink: 0 }}
      />
      {text && (
        <span
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}
        >
          {text}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          width: '100%',
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
