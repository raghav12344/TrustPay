import React from 'react';
import { getRiskScoreColor, normalizeRiskLevel } from '../utils/riskHelpers';
import RiskBadge from './RiskBadge';
import { ShieldAlert, Cpu } from 'lucide-react';

export const RiskIndicator = ({
  score = 0,
  probability = null,
  riskLevel = 'LOW',
  signals = [],
  reasons = [],
  summary = null,
  showAiBadge = true,
}) => {
  const normRisk = normalizeRiskLevel(riskLevel);
  const numericScore = Math.min(Math.max(Math.round(Number(score) || 0), 0), 100);
  const percentProb =
    probability !== null && probability !== undefined
      ? (Number(probability) <= 1 ? (Number(probability) * 100).toFixed(1) : Number(probability).toFixed(1))
      : null;
  const color = getRiskScoreColor(numericScore);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Top Header & Meter */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px',
          backgroundColor: 'var(--bg-card-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Risk Assessment:
            </span>
            <RiskBadge riskLevel={normRisk} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {percentProb !== null && (
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Fraud Prob: <strong style={{ color: 'var(--text-primary)' }}>{percentProb}%</strong>
              </span>
            )}
            <span style={{ fontSize: '14px', fontWeight: 700, color }}>
              Score: {numericScore}/100
            </span>
          </div>
        </div>

        {/* Progress Bar / Risk Meter */}
        <div
          style={{
            width: '100%',
            height: '10px',
            borderRadius: '999px',
            backgroundColor: 'var(--border-color)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${numericScore}%`,
              height: '100%',
              backgroundColor: color,
              borderRadius: '999px',
              transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          <span>0 (Low Risk)</span>
          <span>40 (Medium)</span>
          <span>80 (High Risk)</span>
          <span>100</span>
        </div>
      </div>

      {/* Risk Signals */}
      {signals && signals.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldAlert size={15} color="var(--color-danger)" />
            Detected Risk Signals ({signals.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {signals.map((sig, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)',
                  border: '1px solid var(--color-danger-border)',
                }}
              >
                {typeof sig === 'string' ? sig : sig.name || JSON.stringify(sig)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis / GenAI Explanation */}
      {(reasons.length > 0 || summary) && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Cpu size={15} color="var(--primary)" />
              AI Analysis Breakdown
            </div>
            {showAiBadge && (
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                }}
              >
                AI-generated explanation
              </span>
            )}
          </div>

          {summary && (
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                marginBottom: reasons.length > 0 ? '10px' : '0',
              }}
            >
              {summary}
            </p>
          )}

          {reasons.length > 0 && (
            <ul
              style={{
                paddingLeft: '18px',
                margin: 0,
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              {reasons.map((r, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskIndicator;
