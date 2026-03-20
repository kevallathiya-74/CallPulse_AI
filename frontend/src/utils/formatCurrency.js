/**
 * Format a number as Indian currency (₹)
 * @param {number} amount - The amount to format
 * @param {boolean} compact - Whether to use compact notation (e.g., ₹23.76L)
 * @returns {string}
 */
export function formatCurrency(amount, compact = false) {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';

  if (compact) {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Format ROI savings display
 * @param {number} agents
 * @returns {{ monthly: string, annual: string }}
 */
export function calculateROI(agents) {
  const monthly = agents * 60000 * 0.8 / 12 - (agents / 100 * 999);
  const annual = monthly * 12;
  return {
    monthly: formatCurrency(Math.max(0, Math.round(monthly))),
    annual: formatCurrency(Math.max(0, Math.round(annual))),
    monthlyRaw: monthly,
    annualRaw: annual,
  };
}
