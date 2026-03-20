import { useState, useCallback } from 'react';
import { useAnalysisService } from '../services/analysisService';
import useAnalysisStore from '../store/analysisStore';
import { toUserFriendlyMessage } from '../utils/userFriendlyMessage';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function useAnalysis() {
  const analysisService = useAnalysisService();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setCurrentReport } = useAnalysisStore();

  const uploadAndAnalyze = useCallback(async (formData, onProgress) => {
    setLoading(true);
    setError(null);
    try {
      const uploadResponse = await analysisService.uploadCall(formData, onProgress);
      const uploadData = uploadResponse?.data || uploadResponse;
      const callId = uploadData?.call_id;

      if (!callId) {
        throw new Error('Upload succeeded but no call id was returned');
      }

      let lastStatus = null;
      for (let attempt = 0; attempt < 90; attempt += 1) {
        const statusResponse = await analysisService.getAnalysisStatus(callId);
        const statusData = statusResponse?.data || statusResponse;
        lastStatus = statusData;

        if (typeof onProgress === 'function') {
          const pct = Number(statusData?.progress_percent);
          if (Number.isFinite(pct)) onProgress(pct);
        }

        if (statusData?.status === 'complete') {
          const normalized = {
            call_id: callId,
            status: 'complete',
            processing_time_ms: statusData?.processing_time_ms ?? null,
            progress_percent: statusData?.progress_percent ?? 100,
          };
          setCurrentReport(normalized);
          return { success: true, data: normalized };
        }

        if (statusData?.status === 'failed') {
          throw new Error(statusData?.message || 'Analysis failed');
        }

        await delay(2000);
      }

      throw new Error(lastStatus?.message || 'Analysis is taking longer than expected. Please check reports shortly.');
    } catch (err) {
      const rawMsg = err?.raw?.message || err.response?.data?.message || err.response?.data?.detail || err.message;
      const msg = toUserFriendlyMessage(rawMsg, {
        status: err?.status || err?.response?.status,
        fallback: 'We could not complete this analysis. Please try again.',
      });
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [analysisService, setCurrentReport]);

  const fetchReport = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analysisService.getReport(id);
      setCurrentReport(result);
      return { success: true, data: result };
    } catch (err) {
      const rawMsg = err?.response?.data?.detail || err?.message;
      const msg = toUserFriendlyMessage(rawMsg, {
        status: err?.status || err?.response?.status,
        fallback: 'We could not load the report right now. Please try again.',
      });
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [analysisService, setCurrentReport]);

  return { loading, error, uploadAndAnalyze, fetchReport };
}
