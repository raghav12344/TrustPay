/**
 * Risk evaluation and styling helpers for TrustPay
 */

export const normalizeRiskLevel = (risk) => {
  if (!risk) return 'LOW';
  const upper = String(risk).toUpperCase();
  if (upper.includes('CRITICAL')) return 'CRITICAL';
  if (upper.includes('HIGH')) return 'HIGH';
  if (upper.includes('MEDIUM')) return 'MEDIUM';
  return 'LOW';
};

export const getRiskBadgeClass = (riskLevel) => {
  const norm = normalizeRiskLevel(riskLevel);
  switch (norm) {
    case 'CRITICAL':
      return 'badge badge-critical';
    case 'HIGH':
      return 'badge badge-high';
    case 'MEDIUM':
      return 'badge badge-medium';
    case 'LOW':
    default:
      return 'badge badge-low';
  }
};

export const getStatusBadgeClass = (status) => {
  if (!status) return 'badge badge-neutral';
  const upper = String(status).toUpperCase();
  switch (upper) {
    case 'APPROVED':
      return 'badge badge-approved';
    case 'PENDING':
      return 'badge badge-pending';
    case 'REJECTED':
      return 'badge badge-rejected';
    case 'RESOLVED':
      return 'badge badge-neutral';
    case 'OPEN':
      return 'badge badge-high';
    default:
      return 'badge badge-neutral';
  }
};

export const getRiskScoreColor = (score) => {
  const num = Number(score) || 0;
  if (num >= 80) return '#DC2626'; // High/Critical
  if (num >= 40) return '#D97706'; // Medium
  return '#16A34A'; // Low
};
