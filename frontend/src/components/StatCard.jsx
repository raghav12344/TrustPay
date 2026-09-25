import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, iconBg = 'var(--primary-light)', iconColor = 'var(--primary)', trend = null, loading = false }) => {
  if (loading) {
    return (
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div className="skeleton" style={{ width: '100px', height: '14px' }} />
          <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
        </div>
        <div className="skeleton" style={{ width: '140px', height: '28px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ width: '80px', height: '12px' }} />
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {title}
        </div>
        {Icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: iconBg,
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}
        >
          {value}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {trend && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: trend.isPositive ? 'var(--color-success)' : 'var(--color-danger)',
              }}
            >
              {trend.text}
            </span>
          )}
          {subtitle && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
