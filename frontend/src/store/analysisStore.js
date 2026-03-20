import { create } from 'zustand';

const useAnalysisStore = create((set) => ({
  currentReport: null,
  recentReports: [],
  uploadProgress: 0,

  setCurrentReport: (report) => set({ currentReport: report }),
  setRecentReports: (reports) => set({ recentReports: reports }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  clearCurrentReport: () => set({ currentReport: null, uploadProgress: 0 }),
}));

export default useAnalysisStore;
