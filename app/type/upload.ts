/**
 * Upload API Types
 * Defines interfaces for document upload functionality
 * API Endpoint: https://localhost:7261/api/documents/upload
 */

export interface DocumentMetadata {
  id?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface UploadRequestPayload {
  file: File;
}

export interface UploadResponsePayload {
  success: boolean;
  documentId?: string;
  filePath?: string;
  fileName: string;
  message: string;
  timestamp?: string;
}

export interface UploadErrorResponse {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
  timestamp?: string;
}

export interface UploadStatus {
  success: boolean;
  message: string;
  documentId?: string;
}

export interface UploadProgressEvent {
  fileName: string;
  progress: number; // 0-100
  status: "pending" | "uploading" | "completed" | "failed";
  error?: string;
}

export interface UploadApiConfig {
  endpoint: string;
  method: "POST";
  timeout?: number;
}

// API Configuration
export const UPLOAD_API_CONFIG: UploadApiConfig = {
  endpoint: "https://localhost:7261/api/documents/upload",
  method: "POST",
  timeout: 30000, // 30 seconds
};

// Supported file types for upload
export const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const SUPPORTED_FILE_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
];

// File size limits (in bytes)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB for batch upload
