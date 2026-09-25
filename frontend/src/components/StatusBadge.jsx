import React from 'react';
import { getStatusBadgeClass } from '../utils/riskHelpers';
import { CheckCircle2, Clock, XCircle, Check } from 'lucide-react';

export const StatusBadge = ({ status, showIcon = true }) => {
  const norm = (status || 'UNKNOWN').toUpperCase();
  const badgeClass = getStatusBadgeClass(norm);

  let icon = null;
  if (showIcon) {
    if (norm === 'APPROVED') {
      icon = <CheckCircle2 size={12} strokeWidth={2.5} />;
    } else if (norm === 'PENDING') {
      icon = <Clock size={12} strokeWidth={2.5} />;
    } else if (norm === 'REJECTED') {
      icon = <XCircle size={12} strokeWidth={2.5} />;
    } else if (norm === 'RESOLVED') {
      icon = <Check size={12} strokeWidth={2.5} />;
    }
  }

  return (
    <span className={badgeClass}>
      {icon}
      <span>{norm}</span>
    </span>
  );
};

export default StatusBadge;
