import { create } from "zustand";
import type {
  ReportFilters,
  SpendSummaryReport,
  VendorAnalysisReport,
  TaxVatReport,
  AIInsights,
} from "../type/Report";
import { apiClient } from "../api/client";

interface ReportState {
  isLoading: boolean;
  error: string | null;

  // Report generation
  generateSpendSummary: (
    filters?: ReportFilters,
  ) => Promise<SpendSummaryReport>;
  generateVendorAnalysis: (
    filters?: ReportFilters,
  ) => Promise<VendorAnalysisReport>;
  generateTaxVatReport: (filters?: ReportFilters) => Promise<TaxVatReport>;
  generateAIInsights: () => Promise<AIInsights>;

  clearError: () => void;
}

export const useReportStore = create<ReportState>((set) => ({
  isLoading: false,
  error: null,

  generateSpendSummary: async (filters?: ReportFilters) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.getSpendSummary(filters);

      set({ isLoading: false });
      return response.report;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate spend summary";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  generateVendorAnalysis: async (filters?: ReportFilters) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.getVendorAnalysis(filters);

      set({ isLoading: false });
      return response.report;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate vendor analysis";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  generateTaxVatReport: async (filters?: ReportFilters) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.getTaxReport(filters);

      set({ isLoading: false });
      return response.report;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate tax report";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  generateAIInsights: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.getAIInsights();

      set({ isLoading: false });
      return response.insights;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate AI insights";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useReportStore;
