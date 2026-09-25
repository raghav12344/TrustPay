import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ title, message, type = 'info', duration = 4500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, title, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message, title = 'Success') => {
    showToast({ title, message, type: 'success' });
  }, [showToast]);

  const error = useCallback((message, title = 'Error') => {
    showToast({ title, message, type: 'error' });
  }, [showToast]);

  const warning = useCallback((message, title = 'Attention') => {
    showToast({ title, message, type: 'warning' });
  }, [showToast]);

  const info = useCallback((message, title = 'Information') => {
    showToast({ title, message, type: 'info' });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '420px',
          width: 'calc(100% - 48px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          let icon = <Info size={18} color="#2563EB" />;
          let borderColor = 'var(--border-color)';
          let iconBg = 'var(--primary-light)';

          if (toast.type === 'success') {
            icon = <CheckCircle2 size={18} color="#16A34A" />;
            borderColor = 'var(--color-success-border)';
            iconBg = 'var(--color-success-bg)';
          } else if (toast.type === 'error') {
            icon = <AlertCircle size={18} color="#DC2626" />;
            borderColor = 'var(--color-danger-border)';
            iconBg = 'var(--color-danger-bg)';
          } else if (toast.type === 'warning') {
            icon = <AlertTriangle size={18} color="#D97706" />;
            borderColor = 'var(--color-warning-border)';
            iconBg = 'var(--color-warning-bg)';
          }

          return (
            <div
              key={toast.id}
              className="animate-fade-in"
              style={{
                pointerEvents: 'auto',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xl)',
                border: `1px solid ${borderColor}`,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div
                style={{
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {toast.title && (
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '2px',
                    }}
                  >
                    {toast.title}
                  </div>
                )}
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                  }}
                >
                  {toast.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                }}
                aria-label="Close notification"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
