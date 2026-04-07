/**
 * Document Extraction Utilities
 * Handles AI-driven extraction of document data
 */

import type { ExtractedData } from "../type/Document";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:7261";

/**
 * Extracts document data using the backend OCR/AI service
 * Sends the file to the backend for Mindee OCR processing with regex fallback
 */
export async function extractDocumentData(file: File): Promise<ExtractedData> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", "INVOICE"); // Default type for extraction

    const rememberMe = localStorage.getItem("authRememberMe");
    const token =
      rememberMe === "false"
        ? sessionStorage.getItem("authToken")
        : localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Access token required");
    }

    const controller = new AbortController();
    const timeoutMs = 45_000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${API_BASE_URL}/api/documents/extract`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error || `Extraction failed: ${response.statusText}`,
      );
    }

    const result = await response.json();
    return result.extractedData || result;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Extraction timed out. Please try again.");
    }
    console.error("Extraction error:", error);
    throw error instanceof Error ? error : new Error("Failed to extract data");
  }
}

/**
 * Validates that extracted data has all required fields
 */
export function validateExtractedData(data: ExtractedData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.vendorName?.trim()) {
    errors.push("Vendor name is required");
  }
  if (!data.invoiceNumber?.trim()) {
    errors.push("Invoice number is required");
  }
  if (!data.invoiceDate?.trim()) {
    errors.push("Invoice date is required");
  }
  if (data.amount <= 0) {
    errors.push("Amount must be greater than 0");
  }
  if (data.vatAmount < 0) {
    errors.push("VAT amount cannot be negative");
  }
  if (!data.currency?.trim()) {
    errors.push("Currency is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Formats extracted data for display
 */
export function formatExtractedData(data: ExtractedData): ExtractedData {
  const normalizedDate = data.invoiceDate?.trim();
  const parsedDate = normalizedDate ? new Date(normalizedDate) : null;

  return {
    ...data,
    vendorName: data.vendorName.trim(),
    invoiceNumber: data.invoiceNumber.trim().toUpperCase(),
    invoiceDate:
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toISOString().split("T")[0]
        : normalizedDate || "",
  };
}
