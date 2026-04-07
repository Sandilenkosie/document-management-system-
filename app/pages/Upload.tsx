import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../store/Auth";
import { useDocumentStore } from "../store/Document";
import type { DocumentType } from "../type/Document";
import type { UploadStatus } from "../type/upload";
import {
  extractDocumentData,
  validateExtractedData,
  formatExtractedData,
} from "../utils/extraction";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

interface UploadFile {
  file: File;
  documentType?: DocumentType;
  extractedData?: Awaited<ReturnType<typeof extractDocumentData>>;
  isDuplicate?: boolean;
  extracting?: boolean;
  extractError?: string;
}

const UploadPage = () => {
  const navigate = useNavigate();
  const { user, isAuthInitialized } = useAuthStore();
  const { uploadDocument } = useDocumentStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filesToUpload, setFilesToUpload] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Validate file types - only file types supported by backend OCR extraction
    const validFiles = files.filter((file) => {
      if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
        setUploadStatus({
          success: false,
          message: `File ${file.name} has unsupported type. Only PDF, PNG, JPG, JPEG, WEBP are allowed.`,
        });
        return false;
      }

      if (file.size > MAX_FILE_SIZE) {
        setUploadStatus({
          success: false,
          message: `File ${file.name} exceeds maximum size of 10MB`,
        });
        return false;
      }
      return true;
    });

    setFilesToUpload(
      validFiles.map((file) => ({
        file,
        extracting: false,
      })),
    );
    if (validFiles.length > 0) {
      setUploadStatus(null);
    }
  };

  const removeFile = (index: number) => {
    setFilesToUpload(filesToUpload.filter((_, i) => i !== index));
  };

  const setDocumentType = (index: number, type: DocumentType) => {
    const updated = [...filesToUpload];
    updated[index].documentType = type;
    setFilesToUpload(updated);
  };

  const extractData = async (index: number) => {
    setFilesToUpload((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = {
          ...next[index],
          extracting: true,
          extractError: undefined,
        };
      }
      return next;
    });

    try {
      const targetFile = filesToUpload[index]?.file;
      if (!targetFile) {
        throw new Error("File not found");
      }

      const extractedData = await extractDocumentData(targetFile);
      const formatted = formatExtractedData(extractedData);
      const validation = validateExtractedData(formatted);

      if (!validation.valid) {
        setFilesToUpload((prev) => {
          const next = [...prev];
          if (next[index]) {
            next[index] = {
              ...next[index],
              extracting: false,
              extractError: validation.errors.join(", "),
            };
          }
          return next;
        });
        return;
      }

      // Check for duplicates
      // const duplicate = checkDuplicate(
      //   formatted.invoiceNumber,
      //   formatted.vendorName,
      //   formatted.amount,
      // );

      setFilesToUpload((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = {
            ...next[index],
            extractedData: formatted,
            isDuplicate: false, // duplicate.isDuplicate;
            extracting: false,
            extractError: undefined,
          };
        }
        return next;
      });
    } catch (error) {
      setFilesToUpload((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = {
            ...next[index],
            extracting: false,
            extractError:
              error instanceof Error ? error.message : "Failed to extract data",
          };
        }
        return next;
      });
    }
  };

  const handleUploadFiles = async () => {
    if (filesToUpload.length === 0) return;

    // Validate all files have document type
    const invalid = filesToUpload.filter((f) => !f.documentType);
    if (invalid.length > 0) {
      setUploadStatus({
        success: false,
        message: "All files must have document type selected",
      });
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      const uploadPromises = filesToUpload.map(async (uf) => {
        if (!uf.documentType) throw new Error("Document type is required");

        const backendDocumentType =
          uf.documentType === "invoice" ? "INVOICE" : "CREDIT_NOTE";

        return await uploadDocument(uf.file, backendDocumentType);
      });

      const results = await Promise.all(uploadPromises);
      const duplicates = results.filter((r) => r.isDuplicate).length;

      setUploadStatus({
        success: true,
        message: `Successfully uploaded ${filesToUpload.length} document(s)!${duplicates > 0 ? ` ${duplicates} potential duplicate(s) detected.` : ""}`,
      });

      setFilesToUpload([]);

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      setUploadStatus({
        success: false,
        message: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!isAuthInitialized) {
    return null;
  }

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="text-gray-300 hover:text-white hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-slate-600"></div>
              <h1 className="text-xl font-bold text-white">Document Upload</h1>
            </div>
            <div className="text-sm text-gray-400">Welcome, {user.email}</div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="bg-gradient-to-br from-slate-800/60 via-slate-900/40 to-slate-800/60 border border-slate-700/60 rounded-3xl p-10 backdrop-blur-xl shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Upload Documents
            </h2>
            <p className="text-gray-400 text-lg">
              Upload invoices and credit notes for AI-powered processing and
              approval workflow
            </p>
          </div>

          {/* Upload Area */}
          <div className="mb-8">
            <div
              className="border-2 border-dashed border-slate-600 rounded-2xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-2xl mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Drop files here or click to browse
              </h3>
              <p className="text-gray-400 mb-4">
                Support for PDF, PNG, JPG, JPEG, WEBP files (max 10MB each)
              </p>
              <Button
                variant="outline"
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
              >
                Choose Files
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Selected Files */}
          {filesToUpload.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                Selected Files ({filesToUpload.length})
              </h3>
              <div className="space-y-4">
                {filesToUpload.map((uf, index) => (
                  <div
                    key={index}
                    className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden"
                  >
                    {/* File Header */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {uf.file.name}
                          </p>
                          <p className="text-sm text-gray-400">
                            {formatFileSize(uf.file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Document Type Selection */}
                    <div className="px-4 pb-4 border-t border-slate-700/50 pt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Document Type
                      </label>
                      <div className="flex gap-3">
                        {(
                          [
                            { value: "invoice", label: "Invoice" },
                            { value: "credit-note", label: "Credit Note" },
                          ] as const
                        ).map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setDocumentType(index, option.value)}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                              uf.documentType === option.value
                                ? "bg-blue-600 text-white"
                                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Extract Button */}
                    {uf.documentType && !uf.extractedData && (
                      <div className="px-4 pb-4 border-t border-slate-700/50 pt-4">
                        <Button
                          onClick={() => extractData(index)}
                          disabled={uf.extracting}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          {uf.extracting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Extracting Data...
                            </>
                          ) : (
                            "Extract Data with OCR"
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Extracted Data Display */}
                    {uf.extractedData && (
                      <div className="px-4 pb-4 border-t border-slate-700/50 pt-4">
                        <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Extracted Data
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-400">Vendor</p>
                            <p className="text-white font-medium">
                              {uf.extractedData.vendorName}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Invoice Number</p>
                            <p className="text-white font-medium">
                              {uf.extractedData.invoiceNumber}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Amount</p>
                            <p className="text-white font-medium">
                              {uf.extractedData.currency}{" "}
                              {uf.extractedData.amount.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Date</p>
                            <p className="text-white font-medium">
                              {uf.extractedData.invoiceDate}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">VAT</p>
                            <p className="text-white font-medium">
                              {uf.extractedData.currency}{" "}
                              {uf.extractedData.vatAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Duplicate Alert */}
                        {uf.isDuplicate && (
                          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-yellow-400 font-medium">
                                Duplicate Warning
                              </p>
                              <p className="text-sm text-yellow-300/80">
                                This document may be a duplicate. Please verify
                                before submitting.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error Display */}
                    {uf.extractError && (
                      <div className="px-4 pb-4 border-t border-slate-700/50 pt-4">
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-red-400 font-medium">
                              Extraction Error
                            </p>
                            <p className="text-sm text-red-300/80">
                              {uf.extractError}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus && (
            <div
              className={`mb-6 p-4 rounded-xl border ${
                uploadStatus.success
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              <div className="flex items-center gap-2">
                {uploadStatus.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-medium">{uploadStatus.message}</span>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleUploadFiles}
              disabled={
                filesToUpload.length === 0 ||
                uploading ||
                filesToUpload.some((f) => !f.documentType || !f.extractedData)
              }
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 h-14 px-8 text-lg font-semibold rounded-2xl disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload {filesToUpload.length > 0
                    ? filesToUpload.length
                    : ""}{" "}
                  Document{filesToUpload.length > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
