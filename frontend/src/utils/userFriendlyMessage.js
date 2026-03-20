const STATUS_DEFAULTS = {
  0: 'Unable to connect right now. Please check your internet and try again.',
  400: 'We could not process that request. Please review the details and try again.',
  401: 'Your session has ended. Please sign in again.',
  403: 'You do not have permission for this action.',
  404: 'We could not find what you were looking for.',
  409: 'That record already exists or was updated recently. Please refresh and try again.',
  410: 'This link is no longer available.',
  413: 'This file is too large. Please upload a smaller file.',
  422: 'Some details are missing or invalid. Please review and try again.',
  429: 'You are doing that too quickly. Please wait a moment and try again.',
  500: 'Something went wrong on our side. Please try again shortly.',
  503: 'The AI engine is warming up. Please retry in a moment.',
};

const TECHNICAL_PATTERNS = [
  /traceback/i,
  /exception/i,
  /stack\s*trace/i,
  /sqlalchemy/i,
  /psycopg/i,
  /axios/i,
  /ecconn|econne?refused|econnreset/i,
  /timeout\s*of\s*\d+/i,
  /http\s*\d{3}/i,
  /\b(uvicorn|fastapi|pydantic|jwt|token)\b/i,
  /\{.*\}/,
  /\[.*\]/,
  /<.*>/,
];

function stripNoise(message) {
  if (!message) return '';
  return String(message)
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isTechnical(message) {
  if (!message) return false;
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(message));
}

export function getFriendlyStatusMessage(status) {
  return STATUS_DEFAULTS[Number(status)] || 'Something went wrong. Please try again.';
}

export function toUserFriendlyMessage(rawMessage, options = {}) {
  const { status, fallback } = options;
  const defaultMessage = fallback || getFriendlyStatusMessage(status);

  const cleaned = stripNoise(rawMessage);
  if (!cleaned) return defaultMessage;

  const normalized = cleaned.toLowerCase();

  if (isTechnical(cleaned)) return defaultMessage;
  if (normalized.includes('network error')) return getFriendlyStatusMessage(0);
  if (normalized.includes('failed to fetch')) return getFriendlyStatusMessage(0);
  if (normalized.includes('not authenticated') || normalized.includes('unauthorized')) return getFriendlyStatusMessage(401);
  if (normalized.includes('forbidden')) return getFriendlyStatusMessage(403);
  if (normalized.includes('not found')) return getFriendlyStatusMessage(404);
  if (normalized.includes('too many requests')) return getFriendlyStatusMessage(429);
  if (normalized.includes('timeout')) return 'This is taking longer than expected. Please try again.';

  // Keep short, plain-language messages when they are already user-friendly.
  if (cleaned.length <= 140) return cleaned;

  return defaultMessage;
}
