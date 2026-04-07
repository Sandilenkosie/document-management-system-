import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../store/Auth";
import { useDocumentStore } from "../store/Document";
import { useReportStore } from "../store/Report";
import { exportReportToCSV, exportDocumentsToCSV } from "../utils/export";
import type {
  ReportFilters,
  SpendSummaryReport,
  VendorAnalysisReport,
  TaxVatReport,
} from "../type/Report";
import {
  BarChart3,
  FileText,
  Download,
  ArrowLeft,
  TrendingUp,
  AlertCircle,
  Lightbulb,
} from "lucide-react";

const ReportsPage = () => {
  const navigate = useNavigate();
  const { user, isAuthInitialized } = useAuthStore();
  const { documents } = useDocumentStore();
  const {
    generateSpendSummary,
    generateVendorAnalysis,
    generateTaxVatReport,
    generateAIInsights,
  } = useReportStore();

  const [reportType, setReportType] = useState<"spend" | "vendor" | "tax">(
    "spend",
  );
  const [report, setReport] = useState<
    SpendSummaryReport | VendorAnalysisReport | TaxVatReport | null
  >(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [vendorFilter, setVendorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    ("pending" | "approved" | "rejected")[]
  >([]);
  const [amountMin, setAmountMin] = useState("0");
  const [amountMax, setAmountMax] = useState("999999");

  useEffect(() => {
    if (!isAuthInitialized) {
      return;
    }

    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [isAuthInitialized, user, navigate]);

  if (!isAuthInitialized || !user) return null;

  // Get unique vendors
  const uniqueVendors = Array.from(
    new Set(
      documents
        .map((d) => {
          const extractedVendor = (d as any).extractedData?.vendorName;
          const flatVendor = (d as any).vendorName;
          return String(extractedVendor ?? flatVendor ?? "").trim();
        })
        .filter(Boolean),
    ),
  );

  const applyFilters = () => {
    const newFilters: ReportFilters = {
      dateRange: {
        startDate: dateFrom,
        endDate: dateTo,
      },
    };

    if (vendorFilter) {
      newFilters.vendors = [vendorFilter];
    }

    if (statusFilter.length > 0) {
      newFilters.approvalStatus = statusFilter;
    }

    if (amountMin || amountMax) {
      newFilters.amountRange = {
        min: parseFloat(amountMin) || 0,
        max: parseFloat(amountMax) || 999999,
      };
    }

    return newFilters;
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const currentFilters = applyFilters();

      let reportData;
      if (reportType === "spend") {
        reportData = await generateSpendSummary(currentFilters);
      } else if (reportType === "vendor") {
        reportData = await generateVendorAnalysis(currentFilters);
      } else {
        reportData = await generateTaxVatReport(currentFilters);
      }

      setReport(reportData);
    } catch (error) {
      console.error("Failed to load report:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    try {
      const insightsData = await generateAIInsights();
      setInsights(insightsData);
    } catch (error) {
      console.error("Failed to load insights:", error);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  useEffect(() => {
    loadReport();
  }, [reportType]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
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
              Reports & Analytics
            </h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Report Type Selection */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {(
            [
              { id: "spend", label: "Spend Summary", icon: BarChart3 },
              { id: "vendor", label: "Vendor Analysis", icon: FileText },
              { id: "tax", label: "Tax/VAT Report", icon: TrendingUp },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setReportType(id)}
              className={`p-4 rounded-xl border transition-all ${
                reportType === id
                  ? "bg-blue-600/30 border-blue-500/50"
                  : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-6 h-6 mb-2 text-white" />
              <p className="font-medium text-white">{label}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-white mb-4">Filters</h3>

              <div className="space-y-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Vendor Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Vendor
                  </label>
                  <select
                    value={vendorFilter}
                    onChange={(e) => setVendorFilter(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Vendors</option>
                    {uniqueVendors.map((vendor) => (
                      <option key={vendor} value={vendor}>
                        {vendor}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Approval Status
                  </label>
                  <div className="space-y-2">
                    {(
                      [
                        { value: "pending", label: "Pending" },
                        { value: "approved", label: "Approved" },
                        { value: "rejected", label: "Rejected" },
                      ] as const
                    ).map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={statusFilter.includes(value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStatusFilter([...statusFilter, value]);
                            } else {
                              setStatusFilter(
                                statusFilter.filter((s) => s !== value),
                              );
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-300">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Amount Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Min Amount
                  </label>
                  <input
                    type="number"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Amount
                  </label>
                  <input
                    type="number"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <Button
                  onClick={loadReport}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Main Report */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-300">
                    Generating report...
                  </span>
                </div>
              ) : report ? (
                <>
                  {reportType === "spend" && (
                    <>
                      <h3 className="text-lg font-bold text-white mb-4">
                        Spend Summary
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <p className="text-sm text-gray-400">Total Amount</p>
                          <p className="text-2xl font-bold text-blue-400">
                            $
                            {(report as SpendSummaryReport).totalAmount.toFixed(
                              2,
                            )}
                          </p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <p className="text-sm text-gray-400">
                            Total Documents
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {(report as SpendSummaryReport).totalDocuments}
                          </p>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                          <p className="text-sm text-gray-400">Approved</p>
                          <p className="text-2xl font-bold text-green-400">
                            $
                            {(
                              report as SpendSummaryReport
                            ).approvedAmount.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <p className="text-sm text-gray-400">Average</p>
                          <p className="text-2xl font-bold text-white">
                            $
                            {(
                              report as SpendSummaryReport
                            ).averageAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <p className="text-sm text-gray-400 mb-2">Pending</p>
                          <p className="text-xl font-bold text-yellow-400">
                            $
                            {(
                              report as SpendSummaryReport
                            ).pendingAmount.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <p className="text-sm text-gray-400 mb-2">Rejected</p>
                          <p className="text-xl font-bold text-red-400">
                            $
                            {(
                              report as SpendSummaryReport
                            ).rejectedAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {Object.keys(
                        (report as SpendSummaryReport).currencyBreakdown,
                      ).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-3">
                            By Currency
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(
                              (report as SpendSummaryReport).currencyBreakdown,
                            ).map(([currency, amount]) => (
                              <div
                                key={currency}
                                className="flex justify-between items-center bg-slate-700/50 rounded-lg p-3"
                              >
                                <span className="text-gray-300">
                                  {currency}
                                </span>
                                <span className="font-medium text-white">
                                  ${amount.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {reportType === "vendor" && (
                    <>
                      <h3 className="text-lg font-bold text-white mb-4">
                        Vendor Analysis
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-600">
                              <th className="text-left py-3 px-4 text-gray-400 font-medium">
                                Vendor
                              </th>
                              <th className="text-right py-3 px-4 text-gray-400 font-medium">
                                Total Amount
                              </th>
                              <th className="text-right py-3 px-4 text-gray-400 font-medium">
                                Documents
                              </th>
                              <th className="text-right py-3 px-4 text-gray-400 font-medium">
                                Average
                              </th>
                              <th className="text-right py-3 px-4 text-gray-400 font-medium">
                                Approval Rate
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(report as VendorAnalysisReport).vendors.map(
                              (vendor) => (
                                <tr
                                  key={vendor.name}
                                  className="border-b border-slate-700/50 hover:bg-slate-700/30"
                                >
                                  <td className="py-3 px-4 text-white">
                                    {vendor.name}
                                  </td>
                                  <td className="py-3 px-4 text-right text-white font-medium">
                                    ${vendor.totalAmount.toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4 text-right text-gray-300">
                                    {vendor.documentCount}
                                  </td>
                                  <td className="py-3 px-4 text-right text-gray-300">
                                    ${vendor.averageAmount.toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className="text-green-400 font-medium">
                                      {vendor.approvalRate.toFixed(0)}%
                                    </span>
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {reportType === "tax" && (
                    <>
                      <h3 className="text-lg font-bold text-white mb-4">
                        Tax/VAT Report
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <p className="text-sm text-gray-400">Total Tax</p>
                          <p className="text-2xl font-bold text-blue-400">
                            ${(report as TaxVatReport).totalTax.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <p className="text-sm text-gray-400">Total Amount</p>
                          <p className="text-2xl font-bold text-white">
                            ${(report as TaxVatReport).totalAmount.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <p className="text-sm text-gray-400">Tax Rate</p>
                          <p className="text-2xl font-bold text-white">
                            {(report as TaxVatReport).taxRate.toFixed(2)}%
                          </p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <p className="text-sm text-gray-400">Documents</p>
                          <p className="text-2xl font-bold text-white">
                            {(report as TaxVatReport).documentCount}
                          </p>
                        </div>
                      </div>

                      <h4 className="text-sm font-medium text-gray-300 mb-3">
                        Tax by Vendor
                      </h4>
                      <div className="space-y-2">
                        {(report as TaxVatReport).taxByVendor.map((vendor) => (
                          <div
                            key={vendor.vendorName}
                            className="bg-slate-700/50 rounded-lg p-3"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-white">
                                {vendor.vendorName}
                              </span>
                              <span className="text-blue-400">
                                ${vendor.taxAmount.toFixed(2)} tax
                              </span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-400">
                              <span>Base Amount:</span>
                              <span>${vendor.baseAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No report data available</p>
                </div>
              )}
            </div>

            {/* AI Insights */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                AI-Driven Insights
              </h3>

              {insights ? (
                <>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">
                        Highest Spending Vendor
                      </p>
                      <p className="text-lg font-medium text-blue-400">
                        {insights.trends.highestSpendingVendor}
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">
                        Avg Daily Spend
                      </p>
                      <p className="text-lg font-medium text-white">
                        ${insights.trends.averageDailySpend.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Trend</p>
                      <p
                        className={`text-lg font-medium ${
                          insights.trends.spendingTrend === "increasing"
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {insights.trends.spendingTrend.charAt(0).toUpperCase() +
                          insights.trends.spendingTrend.slice(1)}
                      </p>
                    </div>
                  </div>

                  {insights.anomalies.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        Anomalies Detected
                      </h4>
                      <div className="space-y-2">
                        {insights.anomalies.map((anomaly: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3"
                          >
                            <p className="text-sm text-yellow-300">
                              {anomaly.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-3">
                      Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {insights.recommendations.map(
                        (rec: string, idx: number) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-300 flex gap-2 items-start"
                          >
                            <span className="text-blue-400 font-bold mt-1">
                              •
                            </span>
                            <span>{rec}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400 mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">
                    Loading AI insights...
                  </p>
                </div>
              )}
            </div>

            {/* Export Options */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Export Data</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    exportReportToCSV(
                      report as any,
                      `${reportType}-report-${new Date().toISOString().split("T")[0]}.csv`,
                    )
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Report (CSV)
                </Button>
                <Button
                  onClick={() =>
                    exportDocumentsToCSV(
                      documents,
                      `documents-${new Date().toISOString().split("T")[0]}.csv`,
                    )
                  }
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Documents (CSV)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
