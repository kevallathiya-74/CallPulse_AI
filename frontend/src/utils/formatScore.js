/**
 * Format a quality score for display
 * @param {number} score - 0-100 numeric score
 * @param {string} mode - 'outof' | 'percent' | 'decimal' | 'plain'
 * @returns {string}
 */
export function formatScore(score, mode = 'outof') {
  if (score === null || score === undefined || isNaN(score)) return '—';
  const rounded = Math.round(score * 10) / 10;

  switch (mode) {
    case 'outof':
      return `${rounded} / 100`;
    case 'percent':
      return `${rounded}%`;
    case 'decimal':
      return rounded.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    case 'plain':
    default:
      return String(rounded);
  }
}

/**
 * Format a large Indian-locale number
 */
export function formatIndianNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '—';
  return Number(num).toLocaleString('en-IN');
}

/**
 * Determine score color class based on value
 */
export function getScoreColor(score) {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-error';
}

/**
 * Determine score label based on value
 */
export function getScoreLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Average';
  if (score >= 40) return 'Below Average';
  return 'Poor';
}
