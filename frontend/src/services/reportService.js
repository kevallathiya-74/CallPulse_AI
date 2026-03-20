/**
 * reportService.js — Thin wrapper delegating to dashboardService and analysisService.
 * Kept for backward compatibility with existing page code.
 */
import { useAuthApi } from './api';
import { publicApi } from './api';
import { useMemo } from 'react';

export function useReportService() {
  const authApi = useAuthApi();

  return useMemo(() => ({
    // Dashboard
    getDashboardSummary: () => authApi.get('/api/dashboard/summary'),
    getLeaderboard: (params = {}) => authApi.get('/api/dashboard/leaderboard', { params }),

    // Reports
    listReports: (params = {}) => authApi.get('/api/reports', { params }),
    getReport: (id) => authApi.get(`/api/reports/${id}`),
    deleteReport: (id) => authApi.delete(`/api/reports/${id}`),

    // Health (public)
    getHealth: () => publicApi.get('/api/health'),
  }), [authApi]);
}

// Legacy named export for old code (AnalysisReport.jsx uses this)
export const reportService = {
  getDashboardSummary: () => Promise.reject(new Error('Use useReportService() hook instead')),
  getHealth: () => publicApi.get('/api/health'),
  getReport: (id) => publicApi.get(`/api/reports/${id}`),
  listReports: (params = {}) => publicApi.get('/api/reports', { params }),
  deleteReport: () => Promise.reject(new Error('Use useReportService() hook instead')),
};
