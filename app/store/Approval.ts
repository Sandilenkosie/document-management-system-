import { create } from "zustand";
import { apiClient } from "../api/client";

interface ApprovalState {
  pendingApprovals: any[];
  isLoading: boolean;
  error: string | null;

  // Approval management
  loadPendingApprovals: () => Promise<void>;
  approveAtStage: (
    documentId: string,
    stage: number,
    comment?: string,
  ) => Promise<void>;
  rejectAtStage: (
    documentId: string,
    stage: number,
    comment: string,
  ) => Promise<void>;

  clearError: () => void;
}

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  pendingApprovals: [],
  isLoading: false,
  error: null,

  loadPendingApprovals: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.getPendingApprovals();

      const normalizedApprovals = response.approvals.map((doc: any) => ({
        ...doc,
        extractedData: doc.extractedData ?? {
          vendorName: doc.vendorName ?? "",
          invoiceDate: doc.invoiceDate ?? "",
          invoiceNumber: doc.invoiceNumber ?? "",
          amount: doc.amount ?? 0,
          vatAmount: doc.vatAmount ?? 0,
          currency: doc.currency ?? "USD",
          description: doc.description ?? undefined,
        },
      }));

      set({
        pendingApprovals: normalizedApprovals,
        isLoading: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load approvals";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  approveAtStage: async (
    documentId: string,
    stage: number,
    comment?: string,
  ) => {
    try {
      set({ isLoading: true, error: null });

      await apiClient.approveDocument(documentId, stage, comment);

      // Refresh pending approvals
      await get().loadPendingApprovals();

      set({ isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Approval failed";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  rejectAtStage: async (documentId: string, stage: number, comment: string) => {
    try {
      set({ isLoading: true, error: null });

      await apiClient.rejectDocument(documentId, stage, comment);

      // Refresh pending approvals
      await get().loadPendingApprovals();

      set({ isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Rejection failed";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
