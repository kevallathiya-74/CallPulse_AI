export const QUERY_KEYS = {
  DASHBOARD_SUMMARY: 'dashboard-summary',
  LEADERBOARD: (period) => ['leaderboard', period],
  REPORT: (id) => ['report', id],
  REPORTS: (params) => ['reports', params],
  AGENT: (id) => ['agent', id],
  AGENTS: (params) => ['agents', params],
  DEMO_SENTIMENT: 'demo-sentiment',
  DEMO_SCORECARD: 'demo-scorecard',
  DEMO_COACHING: 'demo-coaching',
  PROFILE: 'profile',
  HEALTH: 'health',
};
