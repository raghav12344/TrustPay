/**
 * Device identification helper for TrustPay
 * Generates and persists a unique client device identifier
 */

const STORAGE_KEY = 'trustpay_device_identifier';

export const getDeviceIdentifier = () => {
  try {
    let identifier = localStorage.getItem(STORAGE_KEY);
    if (!identifier) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        identifier = crypto.randomUUID();
      } else {
        // Fallback UUID v4 generator
        identifier = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
      localStorage.setItem(STORAGE_KEY, identifier);
    }
    return identifier;
  } catch (err) {
    console.warn('Unable to access localStorage for device identifier:', err);
    return 'device-fallback-' + Date.now();
  }
};
