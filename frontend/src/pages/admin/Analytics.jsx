import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { formatINR } from '../../utils/formatting';
import EmptyState from '../../components/EmptyState';
import { BarChart3 } from 'lucide-react';

export const Analytics = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await adminService.getFraudAlerts();
        if (res && res.alerts) {
          setAlerts(res.alerts);
        }
      } catch (err) {
        console.error('Failed to load analytics alerts:', err);
      }
    };
    fetchAnalytics();
  }, []);

  const total = alerts.length;
  const criticalCount = alerts.filter(
    (a) => (a.severity || '').toUpperCase() === 'CRITICAL'
  ).length;
  const highCount = alerts.filter(
    (a) => (a.severity || a.prediction || '').toUpperCase() === 'HIGH' || (a.prediction || '').toUpperCase() === 'HIGH_RISK'
  ).length;
  const openCount = alerts.filter(
    (a) => (a.alert_status || 'OPEN').toUpperCase() === 'OPEN'
  ).length;
  const resolvedCount = alerts.filter(
    (a) => (a.alert_status || '').toUpperCase() === 'RESOLVED'
  ).length;

  const totalAtRiskAmount = alerts.reduce(
    (sum, a) => sum + (Number(a.amount) || 0),
    0
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Fraud Analytics & Metrics</h1>
        <p style={{ fontSize: '14px', marginTop: '4px' }}>
          Aggregated risk distribution and telemetry trends across suspicious transactions.
        </p>
      </div>

      {total === 0 ? (
        <div className="card" style={{ padding: '24px' }}>
          <EmptyState
            icon={BarChart3}
            title="No alert analytics available"
            message="Once fraud alerts are logged by the Sentinel ML engine, metrics will aggregate here."
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Summary Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '18px',
            }}
          >
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Total Flagged Value
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatINR(totalAtRiskAmount)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Accumulated across {total} events
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Queue Resolution Rate
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)' }}>
                {total > 0 ? `${Math.round((resolvedCount / total) * 100)}%` : '100%'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {resolvedCount} resolved / {openCount} open
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Critical Incident Ratio
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-danger)' }}>
                {total > 0 ? `${Math.round((criticalCount / total) * 100)}%` : '0%'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {criticalCount} critical events
              </div>
            </div>
          </div>

          {/* Risk Severity Breakdown Card */}
          <div className="card" style={{ padding: '28px' }}>
            <h2 className="card-title" style={{ marginBottom: '18px' }}>
              Severity Level Distribution
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Critical */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-critical)' }}>CRITICAL RISK</span>
                  <span>{criticalCount} ({total > 0 ? Math.round((criticalCount / total) * 100) : 0}%)</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${total > 0 ? (criticalCount / total) * 100 : 0}%`, height: '100%', backgroundColor: 'var(--color-critical)' }} />
                </div>
              </div>

              {/* High */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>HIGH RISK</span>
                  <span>{highCount} ({total > 0 ? Math.round((highCount / total) * 100) : 0}%)</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${total > 0 ? (highCount / total) * 100 : 0}%`, height: '100%', backgroundColor: 'var(--color-danger)' }} />
                </div>
              </div>

              {/* Resolved / Clear */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>RESOLVED AUDITS</span>
                  <span>{resolvedCount} ({total > 0 ? Math.round((resolvedCount / total) * 100) : 0}%)</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${total > 0 ? (resolvedCount / total) * 100 : 0}%`, height: '100%', backgroundColor: 'var(--color-success)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
