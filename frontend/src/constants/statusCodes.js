export const STATUS_CODES = {
  200: 'Success',
  201: 'Created successfully',
  400: 'Invalid request — please check your input',
  401: 'Session expired — please sign in again',
  403: 'You do not have permission to access this',
  404: 'The requested resource was not found',
  409: 'A conflict occurred — this record may already exist',
  422: 'Validation failed — please review your input',
  429: 'Too many requests — please wait a moment',
  500: 'Server error — our team has been notified',
  503: 'AI Engine temporarily unavailable — retrying...',
};

export function getStatusMessage(code) {
  return STATUS_CODES[code] || `Unexpected error (${code})`;
}

export function getStatusCategory(code) {
  if (code >= 200 && code < 300) return 'success';
  if (code >= 400 && code < 500) return 'warning';
  if (code >= 500) return 'error';
  return 'info';
}
