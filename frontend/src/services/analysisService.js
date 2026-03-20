/**
 * analysisService.js — Analysis and report API calls.
 * Returns a hook that exposes all analysis-related methods.
 */
import { useAuthApi } from './api';
import { useUploadApi } from './api';
import { useMemo } from 'react';

export function useAnalysisService() {
  const authApi = useAuthApi();
  const uploadApi = useUploadApi();

  return useMemo(() => ({
    /**
     * Upload a call file for analysis.
     * @param {FormData} formData - file + agent_id + campaign_type
     * @param {Function} onUploadProgress - progress callback (0-100)
     * @returns {Promise} { call_id, message }
     */
    uploadCall: (formData, onUploadProgress) =>
      uploadApi.post('/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onUploadProgress && e.total) {
            onUploadProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      }),

    /**
     * Poll analysis status until complete or failed.
     * @param {string} callId
     * @returns {Promise} { call_id, status, progress_percent, message }
     */
    getAnalysisStatus: (callId) =>
      authApi.get(`/api/analyze/status/${callId}`),

    /**
     * Start polling status every 3 seconds.
     * @param {string} callId
     * @param {Function} onUpdate - called with status object each poll
     * @param {Function} onComplete - called when status === 'complete'
     * @param {Function} onError - called when status === 'failed'
     * @returns {Function} stop - call to stop polling
     */
    pollStatus: (callId, onUpdate, onComplete, onError, getStatus) => {
      const interval = setInterval(async () => {
        try {
          const result = await getStatus(callId);
          const data = result?.data || result;
          onUpdate(data);
          if (data?.status === 'complete') {
            clearInterval(interval);
            onComplete(data);
          } else if (data?.status === 'failed') {
            clearInterval(interval);
            onError(data?.message || 'Analysis failed');
          }
        } catch (err) {
          clearInterval(interval);
          onError(err?.message || 'Status check failed');
        }
      }, 3000);

      return () => clearInterval(interval);
    },

    /**
     * Fetch a full analysis report.
     * @param {string} reportId
     */
    getReport: (reportId) => authApi.get(`/api/reports/${reportId}`),

    /**
     * List reports with optional filters.
     * @param {Object} params - page, per_page, agent_id, date_from, date_to, min_score
     */
    listReports: (params = {}) => authApi.get('/api/reports', { params }),

    /**
     * Download a PDF report and trigger browser download.
     * @param {string} reportId
     */
    downloadReportPdf: async (reportId) => {
      const response = await authApi.get(`/api/reports/${reportId}/pdf`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },

    /**
     * Create a shareable link for a report.
     * @param {string} reportId
     * @returns {Promise} { share_url, expires_at }
     */
    shareReport: (reportId) =>
      authApi.post(`/api/reports/${reportId}/share`),
  }), [authApi, uploadApi]);
}

// Legacy compatible export (for existing code using named analysisService)
export const analysisService = {
  // These are stubs — components that call these should migrate to useAnalysisService()
  analyze: () => Promise.reject(new Error('Use useAnalysisService().uploadCall() instead')),
  getReport: () => Promise.reject(new Error('Use useAnalysisService().getReport() instead')),
};
