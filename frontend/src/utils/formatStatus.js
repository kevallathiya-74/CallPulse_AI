import { STATUS_CODES, getStatusMessage, getStatusCategory } from '../constants/statusCodes';

/**
 * Get a user-friendly status display object
 * @param {number} code - HTTP status code
 * @returns {{ message: string, category: string, label: string }}
 */
export function formatStatus(code) {
  return {
    message: getStatusMessage(code),
    category: getStatusCategory(code),
    label: formatStatusLabel(code),
    code,
  };
}

/**
 * Format a call/analysis status string for display
 * @param {string} status - raw status from API
 * @returns {string}
 */
export function formatStatusLabel(status) {
  const map = {
    compliant: 'Compliant',
    at_risk: 'At Risk',
    flagged: 'Flagged',
    processing: 'Processing',
    complete: 'Complete',
    completed: 'Complete',
    failed: 'Failed',
    pending: 'Pending',
  };
  if (typeof status === 'number') {
    return getStatusMessage(status);
  }
  return map[String(status).toLowerCase()] || status;
}

/**
 * Get Tailwind color classes for a status
 */
export function getStatusClasses(status) {
  const s = String(status).toLowerCase();
  const map = {
    compliant: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
    complete: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
    completed: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
    at_risk: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
    flagged: { bg: 'bg-error/10', text: 'text-error', border: 'border-error/30' },
    failed: { bg: 'bg-error/10', text: 'text-error', border: 'border-error/30' },
    processing: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
    pending: { bg: 'bg-text-muted/10', text: 'text-text-muted', border: 'border-text-muted/30' },
  };
  return map[s] || { bg: 'bg-text-muted/10', text: 'text-text-muted', border: 'border-text-muted/30' };
}
