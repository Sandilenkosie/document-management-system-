import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "./Auth";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setUploadStatus(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          "https://localhost:7261/api/documents/upload",
          {
            method: "POST",
            body: formData,
            headers: {
              // Add authorization header if needed
              // 'Authorization': `Bearer ${user?.token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to upload ${file.name}: ${response.statusText}`,
          );
        }

        return await response.json();
      });

      await Promise.all(uploadPromises);

      setUploadStatus({
        success: true,
        message: `Successfully uploaded ${selectedFiles.length} document(s)!`,
      });

      // Clear files after successful upload
      setSelectedFiles([]);

      // Redirect to dashboard after a short delay
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

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Custom Top Navigation */}
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

      <div className="container mx-auto px-6 py-12 max-w-4xl">
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
              Select and upload your documents for AI-powered processing and
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
                Support for PDF, DOC, DOCX, XLS, XLSX files (max 10MB each)
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
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                Selected Files ({selectedFiles.length})
              </h3>
              <div className="space-y-3">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{file.name}</p>
                        <p className="text-sm text-gray-400">
                          {formatFileSize(file.size)}
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
              onClick={uploadFiles}
              disabled={selectedFiles.length === 0 || uploading}
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
                  Upload{" "}
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} Document${selectedFiles.length > 1 ? "s" : ""}`
                    : "Documents"}
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
