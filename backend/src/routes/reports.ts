import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { OCRSpaceExtractionService } from "../lib/ocrspace.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const reportFiltersSchema = z.object({
  dateRange: z
    .object({
      startDate: z.string(),
      endDate: z.string(),
    })
    .optional(),
  vendors: z.array(z.string()).optional(),
  approvalStatus: z
    .array(z.enum(["PENDING", "APPROVED", "REJECTED"]))
    .optional(),
  amountRange: z
    .object({
      min: z.number(),
      max: z.number(),
    })
    .optional(),
});

function parseListParam(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).filter(Boolean);
  }
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseReportFilters(query: any) {
  const raw = {
    dateRange:
      query.startDate && query.endDate
        ? { startDate: String(query.startDate), endDate: String(query.endDate) }
        : undefined,
    vendors: parseListParam(query.vendors),
    approvalStatus: parseListParam(query.approvalStatus),
    amountRange:
      query.minAmount != null || query.maxAmount != null
        ? {
            min: Number(query.minAmount ?? 0),
            max: Number(query.maxAmount ?? Number.MAX_SAFE_INTEGER),
          }
        : undefined,
  };

  return reportFiltersSchema.parse(raw);
}

function buildBaseWhereClause(user: { id: string; role: string }) {
  const canViewAllDocuments =
    user.role === "REVIEWER" ||
    user.role === "MANAGER" ||
    user.role === "ADMIN";

  return canViewAllDocuments ? {} : { uploadedBy: user.id };
}

router.get("/spend-summary", authenticate, async (req, res, next) => {
  try {
    const filters = parseReportFilters(req.query);

    let whereClause: any = buildBaseWhereClause(req.user!);

    // Apply filters
    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.startDate);
      const endDate = new Date(filters.dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);

      whereClause.uploadedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (filters.vendors?.length) {
      whereClause.vendorName = { in: filters.vendors };
    }

    if (filters.approvalStatus?.length) {
      whereClause.approvalStatus = { in: filters.approvalStatus };
    }

    if (filters.amountRange) {
      whereClause.amount = {
        gte: filters.amountRange.min,
        lte: filters.amountRange.max,
      };
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      select: {
        amount: true,
        vatAmount: true,
        currency: true,
        approvalStatus: true,
        uploadedAt: true,
      },
    });
    type SpendSummaryDocument = (typeof documents)[number];

    const totalAmount = documents.reduce(
      (sum: number, doc: SpendSummaryDocument) => sum + (doc.amount || 0),
      0,
    );
    const totalDocuments = documents.length;

    const approvedDocs = documents.filter(
      (d: SpendSummaryDocument) => d.approvalStatus === "APPROVED",
    );
    const pendingDocs = documents.filter(
      (d: SpendSummaryDocument) => d.approvalStatus === "PENDING",
    );
    const rejectedDocs = documents.filter(
      (d: SpendSummaryDocument) => d.approvalStatus === "REJECTED",
    );

    const approvedAmount = approvedDocs.reduce(
      (sum: number, doc: SpendSummaryDocument) => sum + (doc.amount || 0),
      0,
    );
    const pendingAmount = pendingDocs.reduce(
      (sum: number, doc: SpendSummaryDocument) => sum + (doc.amount || 0),
      0,
    );
    const rejectedAmount = rejectedDocs.reduce(
      (sum: number, doc: SpendSummaryDocument) => sum + (doc.amount || 0),
      0,
    );

    const currencyBreakdown: Record<string, number> = {};
    documents.forEach((doc: SpendSummaryDocument) => {
      const currency = doc.currency || "USD";
      currencyBreakdown[currency] =
        (currencyBreakdown[currency] || 0) + (doc.amount || 0);
    });

    const report = {
      type: "spend-summary" as const,
      totalAmount,
      totalDocuments,
      approvedAmount,
      pendingAmount,
      rejectedAmount,
      averageAmount: totalDocuments > 0 ? totalAmount / totalDocuments : 0,
      currencyBreakdown,
      dateRange: filters.dateRange || {
        startDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        endDate: new Date().toISOString(),
      },
    };

    res.json({ report });
  } catch (error) {
    next(error);
  }
});

router.get("/vendor-analysis", authenticate, async (req, res, next) => {
  try {
    const filters = parseReportFilters(req.query);

    let whereClause: any = buildBaseWhereClause(req.user!);

    // Apply filters
    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.startDate);
      const endDate = new Date(filters.dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);

      whereClause.uploadedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (filters.vendors?.length) {
      whereClause.vendorName = { in: filters.vendors };
    }

    if (filters.approvalStatus?.length) {
      whereClause.approvalStatus = { in: filters.approvalStatus };
    }

    if (filters.amountRange) {
      whereClause.amount = {
        gte: filters.amountRange.min,
        lte: filters.amountRange.max,
      };
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      select: {
        vendorName: true,
        amount: true,
        approvalStatus: true,
        uploadedAt: true,
      },
    });
    type VendorAnalysisDocument = (typeof documents)[number];

    const vendorMap: Record<
      string,
      {
        totalAmount: number;
        documentCount: number;
        lastTransaction: string;
        approved: number;
      }
    > = {};

    documents.forEach((doc: VendorAnalysisDocument) => {
      const vendor = doc.vendorName || "Unknown";
      if (!vendorMap[vendor]) {
        vendorMap[vendor] = {
          totalAmount: 0,
          documentCount: 0,
          lastTransaction: doc.uploadedAt.toISOString(),
          approved: 0,
        };
      }
      vendorMap[vendor].totalAmount += doc.amount || 0;
      vendorMap[vendor].documentCount += 1;
      if (doc.approvalStatus === "APPROVED") {
        vendorMap[vendor].approved += 1;
      }
      if (
        new Date(doc.uploadedAt) > new Date(vendorMap[vendor].lastTransaction)
      ) {
        vendorMap[vendor].lastTransaction = doc.uploadedAt.toISOString();
      }
    });

    const vendors = Object.entries(vendorMap).map(([name, data]) => ({
      name,
      totalAmount: data.totalAmount,
      documentCount: data.documentCount,
      averageAmount: data.totalAmount / data.documentCount,
      lastTransaction: data.lastTransaction,
      approvalRate: (data.approved / data.documentCount) * 100,
    }));

    const report = {
      type: "vendor-analysis" as const,
      vendors,
      dateRange: filters.dateRange || {
        startDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        endDate: new Date().toISOString(),
      },
    };

    res.json({ report });
  } catch (error) {
    next(error);
  }
});

router.get("/tax-vat", authenticate, async (req, res, next) => {
  try {
    const filters = parseReportFilters(req.query);

    let whereClause: any = buildBaseWhereClause(req.user!);

    // Apply filters
    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.startDate);
      const endDate = new Date(filters.dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);

      whereClause.uploadedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (filters.vendors?.length) {
      whereClause.vendorName = { in: filters.vendors };
    }

    if (filters.approvalStatus?.length) {
      whereClause.approvalStatus = { in: filters.approvalStatus };
    }

    if (filters.amountRange) {
      whereClause.amount = {
        gte: filters.amountRange.min,
        lte: filters.amountRange.max,
      };
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      select: {
        vendorName: true,
        amount: true,
        vatAmount: true,
        uploadedAt: true,
      },
    });
    type TaxVatDocument = (typeof documents)[number];

    const totalTax = documents.reduce(
      (sum: number, doc: TaxVatDocument) => sum + (doc.vatAmount || 0),
      0,
    );
    const totalAmount = documents.reduce(
      (sum: number, doc: TaxVatDocument) => sum + (doc.amount || 0),
      0,
    );

    const taxByVendor: Record<
      string,
      { taxAmount: number; baseAmount: number }
    > = {};
    documents.forEach((doc: TaxVatDocument) => {
      const vendor = doc.vendorName || "Unknown";
      if (!taxByVendor[vendor]) {
        taxByVendor[vendor] = { taxAmount: 0, baseAmount: 0 };
      }
      taxByVendor[vendor].taxAmount += doc.vatAmount || 0;
      taxByVendor[vendor].baseAmount += doc.amount || 0;
    });

    const report = {
      type: "tax-vat" as const,
      totalTax,
      totalAmount,
      taxRate: totalAmount > 0 ? (totalTax / totalAmount) * 100 : 0,
      documentCount: documents.length,
      taxByVendor: Object.entries(taxByVendor).map(([vendorName, data]) => ({
        vendorName,
        ...data,
      })),
      dateRange: filters.dateRange || {
        startDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        endDate: new Date().toISOString(),
      },
    };

    res.json({ report });
  } catch (error) {
    next(error);
  }
});

router.get("/insights", authenticate, async (req, res, next) => {
  try {
    const documents = await prisma.document.findMany({
      select: {
        vendorName: true,
        amount: true,
        approvalStatus: true,
        uploadedAt: true,
      },
      orderBy: { uploadedAt: "desc" },
      take: 100, // Limit for AI processing
    });

    const insights =
      await OCRSpaceExtractionService.generateInsights(documents);

    res.json({ insights });
  } catch (error) {
    next(error);
  }
});

export { router as reportRoutes };
