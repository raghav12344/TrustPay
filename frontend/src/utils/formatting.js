/**
 * Formatting utilities for TrustPay
 */

/**
 * Format monetary amount in Indian Rupee (INR)
 * Example: 125000 -> ₹1,25,000.00
 */
export const formatINR = (amount) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
};

/**
 * Format standard date and time
 * Example: 2026-09-25T16:00:00.000Z -> 25 Sep 2026, 09:30 PM
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateString;
  }
};

/**
 * Format date only
 */
export const formatDateOnly = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
};

/**
 * Relative time helper (e.g. 5m ago, 2h ago)
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 30) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDateOnly(dateString);
  } catch {
    return '';
  }
};

/**
 * Mask account number
 * Example: TP0000000001 -> •••• •••• 0001
 */
export const maskAccountNumber = (accNumber) => {
  if (!accNumber) return '•••• •••• ••••';
  const str = String(accNumber);
  if (str.length <= 4) return str;
  const lastFour = str.slice(-4);
  return `•••• •••• ${lastFour}`;
};
