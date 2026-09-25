import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  message = 'There is no data to display right now.',
  action = null,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-color)',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-card-subtle)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Icon size={26} strokeWidth={1.5} />
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
          maxWidth: '380px',
          lineHeight: 1.5,
          marginBottom: action ? '20px' : '0',
        }}
      >
        {message}
      </p>

      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
