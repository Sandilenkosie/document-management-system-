import { create } from "zustand";
import type { Document } from "../type/Document";
import { apiClient } from "../api/client";

interface DocumentState {
  documents: Document[];
  isLoading: boolean;
  error: string | null;

  // Document management
  uploadDocument: (
    file: File,
    documentType: "INVOICE" | "CREDIT_NOTE",
  ) => Promise<Document>;
  loadDocuments: () => Promise<void>;
  getDocument: (id: string) => Promise<Document>;
  refreshDocuments: () => Promise<void>;

  clearError: () => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,

  uploadDocument: async (
    file: File,
    documentType: "INVOICE" | "CREDIT_NOTE",
  ) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.uploadDocument(file, documentType);

      // Refresh documents list
      await get().refreshDocuments();

      set({ isLoading: false });
      return response.document;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  loadDocuments: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.getDocuments();

      set({
        documents: response.documents,
        isLoading: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load documents";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  getDocument: async (id: string) => {
    try {
      const response = await apiClient.getDocument(id);
      return response.document;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load document";
      throw new Error(message);
    }
  },

  refreshDocuments: async () => {
    try {
      const response = await apiClient.getDocuments();
      set({ documents: response.documents });
    } catch (error) {
      console.error("Failed to refresh documents:", error);
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
