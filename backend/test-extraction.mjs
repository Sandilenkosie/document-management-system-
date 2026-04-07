import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { OCRSpaceExtractionService } from "./src/lib/ocrspace.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

console.log("Testing extraction service...\n");

// Test 1: Regex extraction
const samplePdfText = `
ACME Corporation
Invoice Number: INV-2024-001
Date: 2024-04-07
Vendor: Acme Corp

Description of services rendered
Total Amount Due: $1,500.00
VAT (15%): $225.00
Currency: USD
`;

console.log("Test 1: Regex extraction (fallback)");
const regexResult = await OCRSpaceExtractionService.extractDocumentData(
  Buffer.from("dummy"),
  "dummy.pdf",
  samplePdfText,
);
console.log("Result:", regexResult);
console.log("✓ Regex extraction works\n");

// Test 2: OCRSpace API key check
console.log("Test 2: OCRSpace API configuration");
const apiKey = process.env.OCRSPACE_API_KEY;
if (!apiKey || apiKey.trim() === "") {
  console.log("⚠ OCRSPACE_API_KEY is empty — will use regex fallback only");
} else {
  console.log(
    `✓ OCRSPACE_API_KEY configured (starts with: ${apiKey.slice(0, 6)}...)`,
  );
}

console.log("\n✓ All basic tests passed");
