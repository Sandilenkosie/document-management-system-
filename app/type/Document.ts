/**
 * Document Management Types
 * Defines interfaces for document handling, extraction, and approval
 */

export type DocumentType = "invoice" | "credit-note";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ApprovalStage = 1 | 2 | 3;

export interface ExtractedData {
  vendorName: string;
  invoiceDate: string;
  invoiceNumber: string;
  amount: number;
  vatAmount: number;
  currency: string;
  description?: string;
}

export interface Document {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  documentType: DocumentType;
  uploadedBy: string;
  uploadedAt: string;
  extractedData: ExtractedData;
  isDuplicate: boolean;
  duplicateOf?: string;
  currentApprovalStage: ApprovalStage;
  approvalStatus: ApprovalStatus;
  approvals: Approval[];
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  documentId: string;
  stage: ApprovalStage;
  approverRole: "reviewer" | "manager" | "admin";
  approverId?: string;
  approverEmail?: string;
  status: ApprovalStatus;
  comment?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
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
  extractedData?: ExtractedData;
  isDuplicate?: boolean;
  timestamp?: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchType: "invoice_number" | "vendor_amount" | "none";
  duplicateDocumentId?: string;
  duplicateFileName?: string;
}
