export interface ExtractedData {
  vendorName: string;
  invoiceDate: string;
  invoiceNumber: string;
  amount: number;
  vatAmount: number;
  currency: string;
  description?: string | undefined;
}

interface OcrSpaceResponse {
  OCRExitCode?: number;
  ParsedResults?: Array<{ ParsedText?: string }>;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ErrorDetails?: string;
}

function extractWithRegex(text: string): ExtractedData {
  const normalized = text.replace(/\r\n/g, "\n");

  const invMatch = normalized.match(
    /(?:invoice\s*(?:no|number|#)[:\s#]*)([\w\-\/]+)/i,
  );
  const invoiceNumber = invMatch?.[1]?.trim() ?? "";

  const dateMatch =
    normalized.match(
      /(?:date|dated)[:\s]*([0-3]?\d[\/\-\.][0-1]?\d[\/\-\.]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+\w+\s+\d{4})/i,
    ) ?? normalized.match(/(\d{4}-\d{2}-\d{2})/);
  let invoiceDate = dateMatch?.[1]?.trim() ?? "";
  if (invoiceDate && !/^\d{4}-\d{2}-\d{2}$/.test(invoiceDate)) {
    const d = new Date(invoiceDate);
    if (!isNaN(d.getTime())) {
      invoiceDate = d.toISOString().split("T")[0] ?? invoiceDate;
    }
  }

  const currencySymbols: Record<string, string> = {
    $: "USD",
    "€": "EUR",
    "£": "GBP",
    R: "ZAR",
  };
  const currencyCodeMatch = normalized.match(
    /\b(USD|EUR|GBP|ZAR|AUD|CAD|JPY|CNY)\b/i,
  );
  let currency = currencyCodeMatch?.[1]?.toUpperCase() ?? "";
  if (!currency) {
    for (const [sym, code] of Object.entries(currencySymbols)) {
      if (normalized.includes(sym)) {
        currency = code;
        break;
      }
    }
  }
  currency = currency || "USD";

  const amountMatch =
    normalized.match(
      /(?:total\s*(?:amount|due)?|amount\s*due|grand\s*total)[:\s]*[^\d]*([\d,]+(?:\.\d{2})?)/i,
    ) ?? normalized.match(/[€$£R]([\d,]+(?:\.\d{2})?)/);
  const amount = parseFloat((amountMatch?.[1] ?? "0").replace(/,/g, "")) || 0;

  const vatMatch = normalized.match(
    /(?:vat|tax|gst)[:\s]*[^\d]*([\d,]+(?:\.\d{2})?)/i,
  );
  const vatAmount = parseFloat((vatMatch?.[1] ?? "0").replace(/,/g, "")) || 0;

  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const vendorName =
    lines.find(
      (l) =>
        l.length > 2 && l.length < 80 && !/^invoice/i.test(l) && !/^\d/.test(l),
    ) ?? "";

  return {
    vendorName,
    invoiceDate,
    invoiceNumber,
    amount,
    vatAmount,
    currency,
  };
}

export class OCRSpaceExtractionService {
  static async extractDocumentData(
    buffer: Buffer,
    filename: string,
    fallbackText: string,
  ): Promise<ExtractedData> {
    const apiKey = process.env.OCRSPACE_API_KEY?.trim();
    const language = process.env.OCRSPACE_LANGUAGE?.trim() || "eng";
    const engine = process.env.OCRSPACE_ENGINE?.trim() || "2";

    if (!apiKey) {
      console.warn("OCRSPACE_API_KEY not set — using regex extraction.");
      return extractWithRegex(fallbackText);
    }

    try {
      const formData = new FormData();
      formData.append("apikey", apiKey);
      formData.append("language", language);
      formData.append("OCREngine", engine);
      formData.append("isOverlayRequired", "false");
      formData.append("detectOrientation", "true");
      formData.append("scale", "true");
      formData.append("isTable", "true");
      formData.append("file", new Blob([new Uint8Array(buffer)]), filename);

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OCRSpace HTTP ${response.status}`);
      }

      const payload = (await response.json()) as OcrSpaceResponse;
      if (payload.IsErroredOnProcessing || (payload.OCRExitCode ?? 1) !== 1) {
        const message = Array.isArray(payload.ErrorMessage)
          ? payload.ErrorMessage.join(", ")
          : payload.ErrorMessage;
        throw new Error(message || payload.ErrorDetails || "OCRSpace error");
      }

      const ocrText = (payload.ParsedResults ?? [])
        .map((p) => p.ParsedText ?? "")
        .join("\n")
        .trim();

      if (!ocrText && !fallbackText.trim()) {
        throw new Error("OCRSpace returned empty text for this document");
      }

      return extractWithRegex(ocrText || fallbackText);
    } catch (err: any) {
      console.warn(
        "OCRSpace extraction failed, falling back to regex:",
        err?.message ?? String(err),
      );
      return extractWithRegex(fallbackText);
    }
  }

  static async generateInsights(documents: any[]): Promise<{
    trends: {
      highestSpendingVendor: string;
      averageDailySpend: number;
      spendingTrend: "increasing" | "decreasing" | "stable";
    };
    anomalies: Array<{
      unusualAmount?: boolean;
      frequentVendor?: boolean;
      description: string;
    }>;
    recommendations: string[];
  }> {
    if (!documents.length) {
      return {
        trends: {
          highestSpendingVendor: "N/A",
          averageDailySpend: 0,
          spendingTrend: "stable",
        },
        anomalies: [],
        recommendations: ["Upload documents to start tracking spending."],
      };
    }

    const vendorTotals: Record<string, number> = {};
    let total = 0;
    for (const doc of documents) {
      const v = doc.vendorName ?? "Unknown";
      vendorTotals[v] = (vendorTotals[v] ?? 0) + (doc.amount ?? 0);
      total += doc.amount ?? 0;
    }

    const highestSpendingVendor =
      Object.entries(vendorTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

    const dates = documents
      .map((d) => new Date(d.uploadedAt).getTime())
      .filter(Boolean)
      .sort((a, b) => a - b);
    const daySpan =
      dates.length > 1
        ? Math.max(1, (dates[dates.length - 1]! - dates[0]!) / 86_400_000)
        : 1;
    const averageDailySpend = total / daySpan;

    const anomalies: Array<{
      unusualAmount?: boolean;
      frequentVendor?: boolean;
      description: string;
    }> = documents
      .filter((d) => d.amount && d.amount > averageDailySpend * 3)
      .map((d) => ({
        unusualAmount: true as const,
        description: `Unusually high invoice: ${d.vendorName ?? "Unknown"} — ${d.amount}`,
      }));

    const sortedDocs = [...documents].sort(
      (a, b) =>
        new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
    );
    const midpoint = Math.floor(sortedDocs.length / 2);
    const earlier = sortedDocs.slice(0, Math.max(1, midpoint));
    const later = sortedDocs.slice(Math.max(1, midpoint));
    const earlierAvg =
      earlier.reduce((sum, d) => sum + (d.amount ?? 0), 0) / earlier.length;
    const laterAvg =
      later.reduce((sum, d) => sum + (d.amount ?? 0), 0) /
      Math.max(1, later.length);

    let spendingTrend: "increasing" | "decreasing" | "stable" = "stable";
    if (earlierAvg > 0) {
      const deltaRatio = (laterAvg - earlierAvg) / earlierAvg;
      if (deltaRatio > 0.1) spendingTrend = "increasing";
      if (deltaRatio < -0.1) spendingTrend = "decreasing";
    }

    const mostFrequentVendor = Object.entries(vendorTotals).sort(
      (a, b) =>
        sortedDocs.filter((d) => (d.vendorName ?? "Unknown") === b[0]).length -
        sortedDocs.filter((d) => (d.vendorName ?? "Unknown") === a[0]).length,
    )[0]?.[0];

    if (mostFrequentVendor) {
      anomalies.push({
        frequentVendor: true,
        description: `Frequent vendor concentration detected: ${mostFrequentVendor}.`,
      });
    }

    return {
      trends: {
        highestSpendingVendor,
        averageDailySpend: Math.round(averageDailySpend * 100) / 100,
        spendingTrend,
      },
      anomalies,
      recommendations: [
        `${highestSpendingVendor} accounts for the most spending — consider reviewing contracts.`,
        "Continue monitoring spending patterns.",
      ],
    };
  }
}
