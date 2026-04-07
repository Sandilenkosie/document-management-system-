/**
 * Export Utilities
 * Handles exporting reports to PDF and Excel
 */

import type {
  Report,
  SpendSummaryReport,
  VendorAnalysisReport,
  TaxVatReport,
} from "../type/Report";
import type { Document } from "../type/Document";

/**
 * Export report to CSV format (can be opened in Excel)
 */
export function exportReportToCSV(
  report: Report,
  fileName: string = "report.csv",
): void {
  let csvContent = "data:text/csv;charset=utf-8,";

  if (report.type === "spend-summary") {
    csvContent += generateSpendSummaryCSV(report as SpendSummaryReport);
  } else if (report.type === "vendor-analysis") {
    csvContent += generateVendorAnalysisCSV(report as VendorAnalysisReport);
  } else if (report.type === "tax-vat") {
    csvContent += generateTaxVatCSV(report as TaxVatReport);
  }

  downloadFile(csvContent, fileName);
}

/**
 * Export documents list to CSV
 */
export function exportDocumentsToCSV(
  documents: Document[],
  fileName: string = "documents.csv",
): void {
  let csvContent = "data:text/csv;charset=utf-8,";

  // Header
  csvContent +=
    "File Name,Invoice Number,Vendor,Amount,VAT,Date,Status,Upload Date\n";

  // Rows
  documents.forEach((doc) => {
    const row = [
      escapeCSV(doc.fileName),
      escapeCSV(doc.extractedData.invoiceNumber),
      escapeCSV(doc.extractedData.vendorName),
      doc.extractedData.amount.toFixed(2),
      doc.extractedData.vatAmount.toFixed(2),
      doc.extractedData.invoiceDate,
      doc.approvalStatus,
      doc.uploadedAt,
    ];
    csvContent += row.join(",") + "\n";
  });

  downloadFile(csvContent, fileName);
}

/**
 * Generate HTML for PDF generation (browser-based)
 * For production, consider using libraries like jsPDF or html2pdf
 */
export function generatePDFContent(report: Report): string {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #007bff; color: white; }
            .summary-box { background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .metric { display: inline-block; margin-right: 30px; }
            .metric-label { font-size: 12px; color: #666; }
            .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        </style>
    </head>
    <body>
        <h1>${report.type === "spend-summary" ? "Spend Summary Report" : report.type === "vendor-analysis" ? "Vendor Analysis Report" : "Tax/VAT Report"}</h1>
        <p>Period: ${report.dateRange.startDate} to ${report.dateRange.endDate}</p>
        ${generatePDFBody(report)}
    </body>
    </html>
  `;
  return html;
}

/**
 * Print report to PDF using browser
 */
export function printReportToPDF(report: Report): void {
  const content = generatePDFContent(report);
  const blob = new Blob([content], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url;
  document.body.appendChild(iframe);

  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 100);
  }, 250);
}

// Helper functions

function generateSpendSummaryCSV(report: SpendSummaryReport): string {
  let csv = "Spend Summary Report\n";
  csv += `Period,${report.dateRange.startDate},${report.dateRange.endDate}\n\n`;
  csv += "Metric,Amount\n";
  csv += `Total Amount,$${report.totalAmount.toFixed(2)}\n`;
  csv += `Total Documents,${report.totalDocuments}\n`;
  csv += `Approved Amount,$${report.approvedAmount.toFixed(2)}\n`;
  csv += `Pending Amount,$${report.pendingAmount.toFixed(2)}\n`;
  csv += `Rejected Amount,$${report.rejectedAmount.toFixed(2)}\n`;
  csv += `Average Amount,$${report.averageAmount.toFixed(2)}\n\n`;
  csv += "Currency Breakdown\n";
  csv += "Currency,Amount\n";
  Object.entries(report.currencyBreakdown).forEach(([currency, amount]) => {
    csv += `${currency},$${amount.toFixed(2)}\n`;
  });
  return encodeURIComponent(csv);
}

function generateVendorAnalysisCSV(report: VendorAnalysisReport): string {
  let csv = "Vendor Analysis Report\n";
  csv += `Period,${report.dateRange.startDate},${report.dateRange.endDate}\n\n`;
  csv +=
    "Vendor,Total Amount,Document Count,Average Amount,Last Transaction,Approval Rate\n";
  report.vendors.forEach((vendor) => {
    csv += `${escapeCSV(vendor.name)},$${vendor.totalAmount.toFixed(2)},${vendor.documentCount},$${vendor.averageAmount.toFixed(2)},${vendor.lastTransaction},${vendor.approvalRate.toFixed(2)}%\n`;
  });
  return encodeURIComponent(csv);
}

function generateTaxVatCSV(report: TaxVatReport): string {
  let csv = "Tax/VAT Report\n";
  csv += `Period,${report.dateRange.startDate},${report.dateRange.endDate}\n\n`;
  csv += "Metric,Amount\n";
  csv += `Total Tax,$${report.totalTax.toFixed(2)}\n`;
  csv += `Total Amount,$${report.totalAmount.toFixed(2)}\n`;
  csv += `Tax Rate,${report.taxRate.toFixed(2)}%\n`;
  csv += `Document Count,${report.documentCount}\n\n`;
  csv += "Tax by Vendor\n";
  csv += "Vendor,Tax Amount,Base Amount\n";
  report.taxByVendor.forEach((vendor) => {
    csv += `${escapeCSV(vendor.vendorName)},$${vendor.taxAmount.toFixed(2)},$${vendor.baseAmount.toFixed(2)}\n`;
  });
  return encodeURIComponent(csv);
}

function generatePDFBody(report: Report): string {
  if (report.type === "spend-summary") {
    const r = report as SpendSummaryReport;
    return `
      <div class="summary-box">
        <div class="metric">
          <div class="metric-label">Total Amount</div>
          <div class="metric-value">$${r.totalAmount.toFixed(2)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Total Documents</div>
          <div class="metric-value">${r.totalDocuments}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Approved</div>
          <div class="metric-value">$${r.approvedAmount.toFixed(2)}</div>
        </div>
      </div>
      <table>
        <tr><th>Metric</th><th>Amount</th></tr>
        <tr><td>Pending</td><td>$${r.pendingAmount.toFixed(2)}</td></tr>
        <tr><td>Rejected</td><td>$${r.rejectedAmount.toFixed(2)}</td></tr>
        <tr><td>Average</td><td>$${r.averageAmount.toFixed(2)}</td></tr>
      </table>
    `;
  } else if (report.type === "vendor-analysis") {
    const r = report as VendorAnalysisReport;
    return `
      <table>
        <tr>
          <th>Vendor</th>
          <th>Total Amount</th>
          <th>Documents</th>
          <th>Average</th>
          <th>Approval Rate</th>
        </tr>
        ${r.vendors.map((v) => `<tr><td>${v.name}</td><td>$${v.totalAmount.toFixed(2)}</td><td>${v.documentCount}</td><td>$${v.averageAmount.toFixed(2)}</td><td>${v.approvalRate.toFixed(2)}%</td></tr>`).join("")}
      </table>
    `;
  } else {
    const r = report as TaxVatReport;
    return `
      <div class="summary-box">
        <div class="metric">
          <div class="metric-label">Total Tax</div>
          <div class="metric-value">$${r.totalTax.toFixed(2)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Tax Rate</div>
          <div class="metric-value">${r.taxRate.toFixed(2)}%</div>
        </div>
      </div>
      <table>
        <tr><th>Vendor</th><th>Tax Amount</th><th>Base Amount</th></tr>
        ${r.taxByVendor.map((v) => `<tr><td>${v.vendorName}</td><td>$${v.taxAmount.toFixed(2)}</td><td>$${v.baseAmount.toFixed(2)}</td></tr>`).join("")}
      </table>
    `;
  }
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadFile(content: string, fileName: string): void {
  const link = document.createElement("a");
  link.setAttribute("href", content);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
