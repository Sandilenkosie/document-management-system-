import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../store/Auth";
import { apiClient } from "../api/client";
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  BarChart3,
  AlertTriangle,
  UserCheck,
  ArrowRight,
  Activity,
  Zap,
} from "lucide-react";

type DashboardStats = {
  totalDocuments: number;
  pendingApprovals: number;
  approvedToday: number;
  rejectedThisWeek: number;
  duplicateAlerts: number;
  stage1Pending: number;
  stage2Pending: number;
  stage3Pending: number;
};

const DEFAULT_STATS: DashboardStats = {
  totalDocuments: 0,
  pendingApprovals: 0,
  approvedToday: 0,
  rejectedThisWeek: 0,
  duplicateAlerts: 0,
  stage1Pending: 0,
  stage2Pending: 0,
  stage3Pending: 0,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthInitialized } = useAuthStore();
  const userRole = user?.role ?? "USER";
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthInitialized) {
      return;
    }

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    let isCancelled = false;

    const loadDashboardStats = async () => {
      try {
        setIsLoadingStats(true);
        setStatsError(null);

        const { documents } = await apiClient.getDocuments();

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        startOfWeek.setHours(0, 0, 0, 0);

        const normalizedDocs = Array.isArray(documents) ? documents : [];
        const stage1Pending = normalizedDocs.filter(
          (doc) =>
            doc.approvalStatus === "PENDING" && doc.currentApprovalStage === 1,
        ).length;
        const stage2Pending = normalizedDocs.filter(
          (doc) =>
            doc.approvalStatus === "PENDING" && doc.currentApprovalStage === 2,
        ).length;
        const stage3Pending = normalizedDocs.filter(
          (doc) =>
            doc.approvalStatus === "PENDING" && doc.currentApprovalStage === 3,
        ).length;

        let pendingApprovals = normalizedDocs.filter(
          (doc) => doc.approvalStatus === "PENDING",
        ).length;

        if (["REVIEWER", "MANAGER", "ADMIN"].includes(userRole)) {
          const pendingQueue = await apiClient.getPendingApprovals();
          pendingApprovals = Array.isArray(pendingQueue.approvals)
            ? pendingQueue.approvals.length
            : 0;
        }

        const nextStats: DashboardStats = {
          totalDocuments: normalizedDocs.length,
          pendingApprovals,
          approvedToday: normalizedDocs.filter((doc) => {
            if (doc.approvalStatus !== "APPROVED" || !doc.updatedAt) {
              return false;
            }
            return new Date(doc.updatedAt) >= startOfDay;
          }).length,
          rejectedThisWeek: normalizedDocs.filter((doc) => {
            if (doc.approvalStatus !== "REJECTED" || !doc.updatedAt) {
              return false;
            }
            return new Date(doc.updatedAt) >= startOfWeek;
          }).length,
          duplicateAlerts: normalizedDocs.filter((doc) =>
            Boolean(doc.isDuplicate),
          ).length,
          stage1Pending,
          stage2Pending,
          stage3Pending,
        };

        if (!isCancelled) {
          setStats(nextStats);
        }
      } catch (error) {
        if (!isCancelled) {
          setStatsError(
            error instanceof Error
              ? error.message
              : "Failed to load dashboard statistics",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingStats(false);
        }
      }
    };

    void loadDashboardStats();

    return () => {
      isCancelled = true;
    };
  }, [isAuthInitialized, user, navigate]);

  const stage1Progress =
    stats.totalDocuments > 0
      ? Math.round(
          ((stats.totalDocuments - stats.stage1Pending) /
            stats.totalDocuments) *
            100,
        )
      : 0;

  const stage2Progress =
    stats.totalDocuments > 0
      ? Math.round(
          ((stats.totalDocuments - stats.stage2Pending) /
            stats.totalDocuments) *
            100,
        )
      : 0;

  const stage3Progress =
    stats.totalDocuments > 0
      ? Math.round(
          ((stats.totalDocuments - stats.stage3Pending) /
            stats.totalDocuments) *
            100,
        )
      : 0;

  const formatMetric = (value: number) => {
    if (isLoadingStats) {
      return "--";
    }

    return value.toLocaleString();
  };

  const userInitials = (() => {
    const localPart = user?.email?.split("@")[0] ?? "";
    const parts = localPart.split(/[._\-\s]+/).filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return (localPart.slice(0, 2) || "U").toUpperCase();
  })();

  if (!isAuthInitialized || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Custom Top Navigation */}
      <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">MindRift Docs</h1>
                <p className="text-sm text-gray-400">
                  Document Management System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Online</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-sm font-semibold text-blue-200">
                    {userInitials}
                  </div>
                  <p className="text-xs text-gray-400">{userRole}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          <div className="group relative overflow-hidden bg-slate-900/60 border border-slate-700/60 rounded-2xl p-5 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/20 backdrop-blur-sm">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-500/15 rounded-lg border border-blue-500/25">
                  <FileText className="w-5 h-5 text-blue-300" />
                </div>
                <div className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                  Live
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">
                  {formatMetric(stats.totalDocuments)}
                </p>
                <p className="text-xs text-gray-400 font-medium">
                  Total Documents
                </p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-slate-900/60 border border-slate-700/60 rounded-2xl p-5 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/20 backdrop-blur-sm">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-500/15 rounded-lg border border-blue-500/25">
                  <Clock className="w-5 h-5 text-blue-300" />
                </div>
                <div className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                  Pending
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">
                  {formatMetric(stats.pendingApprovals)}
                </p>
                <p className="text-xs text-gray-400 font-medium">
                  Awaiting Approval
                </p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-slate-900/60 border border-slate-700/60 rounded-2xl p-5 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/20 backdrop-blur-sm">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-500/15 rounded-lg border border-blue-500/25">
                  <CheckCircle className="w-5 h-5 text-blue-300" />
                </div>
                <div className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                  Today
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">
                  {formatMetric(stats.approvedToday)}
                </p>
                <p className="text-xs text-gray-400 font-medium">Approved</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-slate-900/60 border border-slate-700/60 rounded-2xl p-5 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/20 backdrop-blur-sm">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-500/15 rounded-lg border border-blue-500/25">
                  <XCircle className="w-5 h-5 text-blue-300" />
                </div>
                <div className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                  Week
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">
                  {formatMetric(stats.rejectedThisWeek)}
                </p>
                <p className="text-xs text-gray-400 font-medium">
                  Rejected This Week
                </p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-slate-900/60 border border-slate-700/60 rounded-2xl p-5 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/20 backdrop-blur-sm">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-500/15 rounded-lg border border-blue-500/25">
                  <AlertTriangle className="w-5 h-5 text-blue-300" />
                </div>
                <div className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                  Alert
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">
                  {formatMetric(stats.duplicateAlerts)}
                </p>
                <p className="text-xs text-gray-400 font-medium">Duplicates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* 3-Step Approval Workflow */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/60 via-slate-900/40 to-slate-800/60 border border-slate-700/60 rounded-3xl p-10 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-500/15 rounded-xl border border-blue-500/25">
                <Activity className="w-7 h-7 text-blue-300" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">
                  Approval Workflow
                </h2>
                <p className="text-gray-400 text-lg">
                  Current approval pipeline status
                </p>
              </div>
              <div className="ml-auto text-sm text-gray-400 bg-slate-700/50 px-4 py-2 rounded-full border border-slate-600/50">
                3-Step Process
              </div>
            </div>

            {statsError ? (
              <div className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                Failed to load live dashboard data: {statsError}
              </div>
            ) : null}

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="group bg-slate-800/50 border border-slate-700/70 rounded-xl p-5 hover:border-blue-500/35 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/15 flex items-center justify-center border border-blue-500/25">
                      <UserCheck className="w-6 h-6 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        Step 1: Reviewer
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Initial document verification
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-300">
                      {formatMetric(stats.stage1Pending)}
                    </div>
                    <div className="text-sm text-gray-400">Pending</div>
                  </div>
                </div>
                <div className="mt-4 bg-slate-900/60 rounded-lg p-3 border border-slate-700/60">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Progress</span>
                    <span className="text-blue-300 font-medium">
                      {stage1Progress}% Complete
                    </span>
                  </div>
                  <div className="mt-2 bg-slate-700/70 rounded-full h-2">
                    <div
                      className="bg-blue-400 h-2 rounded-full"
                      style={{ width: `${stage1Progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group bg-slate-800/50 border border-slate-700/70 rounded-xl p-5 hover:border-blue-500/35 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/15 flex items-center justify-center border border-blue-500/25">
                      <Users className="w-6 h-6 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        Step 2: Manager
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Department head approval
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-300">
                      {formatMetric(stats.stage2Pending)}
                    </div>
                    <div className="text-sm text-gray-400">Pending</div>
                  </div>
                </div>
                <div className="mt-4 bg-slate-900/60 rounded-lg p-3 border border-slate-700/60">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Progress</span>
                    <span className="text-blue-300 font-medium">
                      {stage2Progress}% Complete
                    </span>
                  </div>
                  <div className="mt-2 bg-slate-700/70 rounded-full h-2">
                    <div
                      className="bg-blue-400 h-2 rounded-full"
                      style={{ width: `${stage2Progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group bg-slate-800/50 border border-slate-700/70 rounded-xl p-5 hover:border-blue-500/35 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/15 flex items-center justify-center border border-blue-500/25">
                      <CheckCircle className="w-6 h-6 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        Step 3: Finance
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Final authorization
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-300">
                      {formatMetric(stats.stage3Pending)}
                    </div>
                    <div className="text-sm text-gray-400">Pending</div>
                  </div>
                </div>
                <div className="mt-4 bg-slate-900/60 rounded-lg p-3 border border-slate-700/60">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Progress</span>
                    <span className="text-blue-300 font-medium">
                      {stage3Progress}% Complete
                    </span>
                  </div>
                  <div className="mt-2 bg-slate-700/70 rounded-full h-2">
                    <div
                      className="bg-blue-400 h-2 rounded-full"
                      style={{ width: `${stage3Progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-slate-800/60 via-slate-900/40 to-slate-800/60 border border-slate-700/60 rounded-3xl p-10 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-500/15 rounded-xl border border-blue-500/25">
                <Zap className="w-7 h-7 text-blue-300" />
              </div>
              <h2 className="text-3xl font-bold text-white">Quick Actions</h2>
            </div>

            <div className="space-y-4">
              <Button
                className="w-full justify-between bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 h-16 px-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-105 rounded-2xl"
                onClick={() => navigate("/upload")}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-lg">Upload Document</span>
                </div>
                <ArrowRight className="w-5 h-5" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between border-2 border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 h-16 px-6 transition-all duration-300 hover:shadow-xl rounded-2xl"
                onClick={() => navigate("/approvals")}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-600/50 rounded-xl">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-lg">
                    Review Approvals
                  </span>
                </div>
                <ArrowRight className="w-5 h-5" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between border-2 border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 h-16 px-6 transition-all duration-300 hover:shadow-xl rounded-2xl"
                onClick={() => navigate("/reports")}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-600/50 rounded-xl">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-lg">
                    Generate Reports
                  </span>
                </div>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
