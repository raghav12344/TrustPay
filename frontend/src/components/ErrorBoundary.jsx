import React, { Component } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Exception caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'var(--bg-main, #0f172a)',
            color: 'var(--text-primary, #f8fafc)',
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          }}
        >
          <div
            className="animate-fade-in"
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: 'var(--radius-lg, 16px)',
              padding: '32px 28px',
              boxShadow: 'var(--shadow-xl, 0 20px 35px -5px rgba(0,0,0,0.4))',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.14)',
                color: '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={28} strokeWidth={2.2} />
            </div>

            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary, #f8fafc)',
                marginBottom: '10px',
              }}
            >
              Application Encountered an Error
            </h2>

            <p
              className="prose-cap"
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary, #94a3b8)',
                lineHeight: 1.6,
                marginBottom: '24px',
                maxWidth: '46ch',
                marginInline: 'auto',
              }}
            >
              A client-side runtime exception occurred. The ledger and authentication state remain secure.
            </p>

            {this.state.error && (
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm, 8px)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '12px',
                  color: '#f87171',
                  textAlign: 'left',
                  marginBottom: '24px',
                  overflowX: 'auto',
                }}
              >
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md, 10px)',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={16} />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md, 10px)',
                  cursor: 'pointer',
                }}
              >
                <Home size={16} />
                <span>Go to Homepage</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
