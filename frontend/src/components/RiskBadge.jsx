import React from 'react';
import { getRiskBadgeClass, normalizeRiskLevel } from '../utils/riskHelpers';
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertOctagon } from 'lucide-react';

export const RiskBadge = ({ riskLevel, showIcon = true }) => {
  const norm = normalizeRiskLevel(riskLevel);
  const badgeClass = getRiskBadgeClass(norm);

  let icon = null;
  if (showIcon) {
    switch (norm) {
      case 'CRITICAL':
        icon = <AlertOctagon size={12} strokeWidth={2.5} />;
        break;
      case 'HIGH':
        icon = <ShieldAlert size={12} strokeWidth={2.5} />;
        break;
      case 'MEDIUM':
        icon = <AlertTriangle size={12} strokeWidth={2.5} />;
        break;
      case 'LOW':
      default:
        icon = <ShieldCheck size={12} strokeWidth={2.5} />;
        break;
    }
  }

  return (
    <span className={badgeClass}>
      {icon}
      <span>{norm} RISK</span>
    </span>
  );
};

export default RiskBadge;
