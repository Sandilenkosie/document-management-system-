/**
 * Report Types
 * Defines interfaces for reporting and analytics
 */

export type ReportType = "spend-summary" | "vendor-analysis" | "tax-vat";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ReportFilters {
  dateRange?: DateRange;
  vendors?: string[];
  approvalStatus?: ("pending" | "approved" | "rejected")[];
  amountRange?: {
    min: number;
    max: number;
  };
}

export interface SpendSummaryReport {
  type: "spend-summary";
  totalAmount: number;
  totalDocuments: number;
  approvedAmount: number;
  pendingAmount: number;
  rejectedAmount: number;
  averageAmount: number;
  currencyBreakdown: Record<string, number>;
  dateRange: DateRange;
}

export interface VendorAnalysisReport {
  type: "vendor-analysis";
  vendors: {
    name: string;
    totalAmount: number;
    documentCount: number;
    averageAmount: number;
    lastTransaction: string;
    approvalRate: number;
  }[];
  dateRange: DateRange;
}

export interface TaxVatReport {
  type: "tax-vat";
  totalTax: number;
  totalAmount: number;
  taxRate: number;
  documentCount: number;
  taxByVendor: {
    vendorName: string;
    taxAmount: number;
    baseAmount: number;
  }[];
  dateRange: DateRange;
}

export type Report = SpendSummaryReport | VendorAnalysisReport | TaxVatReport;

export interface AIInsights {
  trends: {
    highestSpendingVendor: string;
    averageDailySpend: number;
    spendingTrend: "increasing" | "decreasing" | "stable";
  };
  anomalies: {
    unusualAmount?: boolean;
    frequentVendor?: boolean;
    description: string;
  }[];
  recommendations: string[];
}
