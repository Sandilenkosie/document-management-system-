import { Router } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { OCRSpaceExtractionService } from "../lib/ocrspace.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { createError } from "../middleware/errorHandler.js";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"));
    }
  },
});

const uploadSchema = z.object({
  documentType: z.enum(["INVOICE", "CREDIT_NOTE"]),
});

function validateExtractedData(data: {
  vendorName?: string;
  invoiceDate?: string;
  invoiceNumber?: string;
  amount?: number;
  vatAmount?: number;
  currency?: string;
}): string[] {
  const errors: string[] = [];
  if (!data.vendorName?.trim()) errors.push("Vendor name is required");
  if (!data.invoiceNumber?.trim()) errors.push("Invoice number is required");
  if (!data.invoiceDate?.trim()) errors.push("Invoice date is required");
  if ((data.amount ?? 0) <= 0) errors.push("Amount must be greater than 0");
  if ((data.vatAmount ?? 0) < 0) errors.push("VAT amount cannot be negative");
  if (!data.currency?.trim()) errors.push("Currency is required");
  return errors;
}

function extractFallbackTextFromBuffer(buffer: Buffer): string {
  return buffer
    .toString("latin1")
    .replace(/\\r\\n/g, "\n")
    .replace(/[^\x20-\x7E\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Extract data from document without uploading
router.post(
  "/extract",
  authenticate,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return next(createError("No file uploaded", 400));
      }

      // Extract text from PDF
      let extractedText = "";
      let pdfParsingFailed = false;

      if (req.file.mimetype === "application/pdf") {
        try {
          const pdfData = await pdfParse(req.file.buffer);
          extractedText = pdfData.text;
        } catch (pdfError) {
          console.warn(
            "PDF parsing failed, will use OCRSpace OCR only:",
            pdfError instanceof Error ? pdfError.message : String(pdfError),
          );
          pdfParsingFailed = true;
          extractedText = extractFallbackTextFromBuffer(req.file.buffer);
        }
      } else {
        // For images, skip text extraction - let OCRSpace handle it
        extractedText = "";
      }

      // Use extraction service to extract structured data
      let extractedData;
      try {
        extractedData = await OCRSpaceExtractionService.extractDocumentData(
          req.file.buffer,
          req.file.originalname,
          extractedText,
        );
      } catch (extractionError) {
        console.error("Extraction error:", extractionError);
        return next(
          createError(
            `Failed to extract data from document: ${extractionError instanceof Error ? extractionError.message : "Unknown error"}`,
            400,
          ),
        );
      }

      res.json({
        extractedData,
        success: true,
        ...(pdfParsingFailed && {
          warning:
            extractedText.length > 0
              ? "PDF parsing failed, using raw text fallback and OCR"
              : "PDF parsing failed, using OCR only",
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return next(createError("No file uploaded", 400));
      }

      const { documentType } = uploadSchema.parse(req.body);

      // Extract text from PDF
      let extractedText = "";
      let pdfParsingFailed = false;
      if (req.file.mimetype === "application/pdf") {
        try {
          const pdfData = await pdfParse(req.file.buffer);
          extractedText = pdfData.text;
        } catch (pdfError) {
          console.warn(
            "PDF parsing failed during upload, will use OCR only:",
            pdfError instanceof Error ? pdfError.message : String(pdfError),
          );
          pdfParsingFailed = true;
          extractedText = extractFallbackTextFromBuffer(req.file.buffer);
        }
      } else {
        extractedText = "";
      }

      // Use AI to extract structured data
      let extractedData;
      let extractionWarning: string | null = null;
      try {
        extractedData = await OCRSpaceExtractionService.extractDocumentData(
          req.file.buffer,
          req.file.originalname,
          extractedText,
        );
        if (!extractedData.vendorName && !extractedData.invoiceNumber) {
          extractionWarning =
            "Extraction returned no data — document saved with empty fields";
        }
      } catch (extractionError) {
        extractionWarning =
          "Extraction failed — document saved with empty fields";
        extractedData = {
          vendorName: "",
          invoiceDate: "",
          invoiceNumber: "",
          amount: 0,
          vatAmount: 0,
          currency: "USD",
          description: undefined,
        };
      }

      const validationErrors = validateExtractedData(extractedData);
      if (validationErrors.length > 0) {
        extractionWarning =
          extractionWarning ??
          `Validation warnings: ${validationErrors.join(", ")}`;
      }

      // Check duplicates by invoice number and by same file fingerprint.
      const duplicateByInvoice =
        extractedData.invoiceNumber && extractedData.vendorName
          ? await prisma.document.findFirst({
              where: {
                invoiceNumber: extractedData.invoiceNumber,
                vendorName: extractedData.vendorName,
              },
            })
          : null;

      const duplicateByFile = await prisma.document.findFirst({
        where: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          fileType: req.file.mimetype,
        },
      });

      const existingDoc = duplicateByInvoice ?? duplicateByFile;
      const duplicateReason = duplicateByInvoice
        ? "invoice_number"
        : duplicateByFile
          ? "file_fingerprint"
          : null;

      // Create document
      const document = await prisma.document.create({
        data: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          fileType: req.file.mimetype,
          documentType,
          uploadedBy: req.user!.id,
          vendorName: extractedData.vendorName ?? null,
          invoiceDate: extractedData.invoiceDate ?? null,
          invoiceNumber: extractedData.invoiceNumber ?? null,
          amount: extractedData.amount ?? null,
          vatAmount: extractedData.vatAmount ?? 0,
          currency: extractedData.currency ?? "USD",
          description: extractedData.description ?? null,
          isDuplicate: !!existingDoc,
          duplicateOf: existingDoc?.id ?? null,
        },
        include: {
          uploader: {
            select: { firstName: true, lastName: true, email: true },
          },
          approvals: true,
        },
      });

      res.status(201).json({
        document,
        isDuplicate: !!existingDoc,
        ...(duplicateReason && { duplicateReason }),
        ...(extractionWarning && { extractionWarning }),
        ...(pdfParsingFailed && {
          extractionWarning:
            extractionWarning ??
            (extractedText.length > 0
              ? "PDF text extraction failed during upload, raw text fallback was used"
              : "PDF text extraction failed during upload, OCR fallback was used"),
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get("/", authenticate, async (req, res, next) => {
  try {
    const canViewAllDocuments =
      req.user!.role === "REVIEWER" ||
      req.user!.role === "MANAGER" ||
      req.user!.role === "ADMIN";

    const documents = await prisma.document.findMany({
      where: canViewAllDocuments ? {} : { uploadedBy: req.user!.id },
      include: {
        uploader: {
          select: { firstName: true, lastName: true, email: true },
        },
        approvals: {
          include: {
            document: false, // Avoid circular reference
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const idParam = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    if (!idParam) {
      return next(createError("Document ID is required", 400));
    }

    const document = await prisma.document.findUnique({
      where: { id: idParam },
      include: {
        uploader: {
          select: { firstName: true, lastName: true, email: true },
        },
        approvals: {
          include: {
            document: false,
          },
        },
      },
    });

    if (!document) {
      return next(createError("Document not found", 404));
    }

    // Check if user has permission to view this document
    if (document.uploadedBy !== req.user!.id && req.user!.role !== "ADMIN") {
      return next(createError("Access denied", 403));
    }

    res.json({ document });
  } catch (error) {
    next(error);
  }
});

export { router as documentRoutes };
