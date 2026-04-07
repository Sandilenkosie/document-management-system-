import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../store/Auth";
import { useApprovalStore } from "../store/Approval";
import {
  CheckCircle,
  XCircle,
  Clock,
  BadgeCheck,
  ArrowLeft,
  FileText,
  UserCheck,
  MessageSquare,
} from "lucide-react";

const WORKFLOW_STEPS = [
  { stage: 1, role: "Reviewer", action: "Approve / Reject" },
  { stage: 2, role: "Manager", action: "Approve / Reject" },
  { stage: 3, role: "Finance/Admin", action: "Final approval" },
] as const;

const ApprovalPage = () => {
  const navigate = useNavigate();
  const { user, isAuthInitialized } = useAuthStore();
  const { loadPendingApprovals, approveAtStage, rejectAtStage } =
    useApprovalStore();

  const { pendingApprovals } = useApprovalStore();
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!isAuthInitialized) {
      return;
    }

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user?.id) {
      loadPendingApprovals();
    }
  }, [isAuthInitialized, user, navigate, loadPendingApprovals]);

  if (!isAuthInitialized || !user) {
    return null;
  }

  const canApprove =
    user.role === "REVIEWER" ||
    user.role === "MANAGER" ||
    user.role === "ADMIN";

  const doc = selectedDoc
    ? pendingApprovals.find((d) => d.id === selectedDoc)
    : null;

  const normalizeStatus = (value?: string) => (value ?? "").toUpperCase();
  const selectedStage = doc?.currentApprovalStage ?? 0;
  const isFinalStage = selectedStage === 3;

  const handleApprove = async () => {
    if (selectedDoc && user.id && doc) {
      await approveAtStage(selectedDoc, doc.currentApprovalStage, comment);
      setSelectedDoc(null);
      setComment("");
    }
  };

  const handleReject = async () => {
    if (selectedDoc && user.id && comment && doc) {
      await rejectAtStage(selectedDoc, doc.currentApprovalStage, comment);
      setSelectedDoc(null);
      setComment("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
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
              <h1 className="text-xl font-bold text-white">
                Approval Workflow
              </h1>
            </div>
            <div className="text-sm text-gray-400">
              {pendingApprovals.length} pending approval
              {pendingApprovals.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="mb-6 rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">
            3-Step Approval Workflow
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {WORKFLOW_STEPS.map((step) => (
              <div
                key={step.stage}
                className="rounded-lg border border-slate-600/40 bg-slate-900/40 p-3"
              >
                <p className="text-xs text-gray-400">Approval {step.stage}</p>
                <p className="font-semibold text-white">{step.role}</p>
                <p className="text-xs text-gray-300">{step.action}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-gray-300">
            <BadgeCheck className="h-4 w-4 text-blue-400" />
            Status tracking: Pending / Approved / Rejected
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Pending Documents */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                Pending Approvals
              </h2>

              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <p className="text-gray-400">
                    {canApprove
                      ? "No pending approvals"
                      : "Your role has no approval permissions. Use REVIEWER, MANAGER or ADMIN."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedDoc === doc.id
                          ? "bg-blue-600/30 border border-blue-500/50"
                          : "bg-slate-700/50 border border-slate-600/50 hover:bg-slate-700"
                      }`}
                    >
                      <p className="font-medium text-white truncate">
                        {doc.extractedData.invoiceNumber}
                      </p>
                      <p className="text-xs text-gray-400">
                        {doc.extractedData.vendorName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Stage {doc.currentApprovalStage}
                      </p>
                      <p
                        className={`text-xs font-semibold ${
                          normalizeStatus(doc.approvalStatus) === "APPROVED"
                            ? "text-green-400"
                            : normalizeStatus(doc.approvalStatus) === "REJECTED"
                              ? "text-red-400"
                              : "text-yellow-400"
                        }`}
                      >
                        {normalizeStatus(doc.approvalStatus).charAt(0) +
                          normalizeStatus(doc.approvalStatus)
                            .slice(1)
                            .toLowerCase()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Document Details */}
          <div className="lg:col-span-2">
            {doc ? (
              <div className="space-y-4">
                {/* Document Info Card */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">
                        {doc.fileName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {doc.documentType}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Extracted Data */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Document Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Vendor</p>
                      <p className="font-medium text-white">
                        {doc.extractedData.vendorName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Invoice Number</p>
                      <p className="font-medium text-white">
                        {doc.extractedData.invoiceNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Amount</p>
                      <p className="font-medium text-white">
                        {doc.extractedData.currency}{" "}
                        {doc.extractedData.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Date</p>
                      <p className="font-medium text-white">
                        {doc.extractedData.invoiceDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">VAT</p>
                      <p className="font-medium text-white">
                        {doc.extractedData.currency}{" "}
                        {doc.extractedData.vatAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <p
                        className={`font-medium ${
                          normalizeStatus(doc.approvalStatus) === "APPROVED"
                            ? "text-green-400"
                            : normalizeStatus(doc.approvalStatus) === "REJECTED"
                              ? "text-red-400"
                              : "text-yellow-400"
                        }`}
                      >
                        {normalizeStatus(doc.approvalStatus).charAt(0) +
                          normalizeStatus(doc.approvalStatus)
                            .slice(1)
                            .toLowerCase()}
                        {" · "}
                        Stage {doc.currentApprovalStage}/3
                      </p>
                    </div>
                  </div>
                </div>

                {/* Approval Stages */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Approval Stages
                  </h3>
                  <div className="space-y-3">
                    {[1, 2, 3].map((stage) => {
                      const stageApprovalsData = doc.approvals.filter(
                        (a: any) => a.stage === stage,
                      );
                      const stageStatus =
                        stageApprovalsData.length > 0
                          ? normalizeStatus(stageApprovalsData[0].status)
                          : "PENDING";
                      const roleLabel =
                        WORKFLOW_STEPS.find((item) => item.stage === stage)
                          ?.role ?? "Unknown";

                      return (
                        <div
                          key={stage}
                          className={`p-4 rounded-lg border ${
                            stageStatus === "APPROVED"
                              ? "bg-green-500/10 border-green-500/30"
                              : stageStatus === "REJECTED"
                                ? "bg-red-500/10 border-red-500/30"
                                : "bg-slate-700/50 border-slate-600/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {stageStatus === "APPROVED" ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : stageStatus === "REJECTED" ? (
                                <XCircle className="w-5 h-5 text-red-400" />
                              ) : (
                                <Clock className="w-5 h-5 text-yellow-400" />
                              )}
                              <div>
                                <p className="font-medium text-white">
                                  Step {stage}: {roleLabel}
                                </p>
                                {stageApprovalsData.length > 0 && (
                                  <p className="text-sm text-gray-400">
                                    {stageApprovalsData[0].approverEmail ||
                                      "System"}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                stageStatus === "APPROVED"
                                  ? "text-green-400"
                                  : stageStatus === "REJECTED"
                                    ? "text-red-400"
                                    : "text-yellow-400"
                              }`}
                            >
                              {stageStatus.charAt(0).toUpperCase() +
                                stageStatus.slice(1).toLowerCase()}
                            </span>
                          </div>
                          {stageApprovalsData.length > 0 &&
                            stageApprovalsData[0].comment && (
                              <p className="mt-2 text-sm text-gray-300 border-t border-slate-600/50 pt-2">
                                <span className="font-medium">Comment:</span>{" "}
                                {stageApprovalsData[0].comment}
                              </p>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Approval Action */}
                {doc.currentApprovalStage <= 3 &&
                  normalizeStatus(doc.approvalStatus) === "PENDING" && (
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-blue-400" />
                        Your Action Required
                      </h3>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <MessageSquare className="w-4 h-4 inline mr-1" />
                          Comment/Notes
                        </label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add any comments or notes for this approval..."
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={handleApprove}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {isFinalStage ? "Final Approve" : "Approve"}
                        </Button>
                        {!isFinalStage && (
                          <Button
                            onClick={() => {
                              if (!comment) {
                                alert("Please add a comment for rejection");
                                return;
                              }
                              handleReject();
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-12 text-center">
                <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">
                  Select a document to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalPage;
