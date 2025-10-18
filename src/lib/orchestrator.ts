import { supabase } from "@/integrations/supabase/client";
import { eventBus } from "./eventBus";
import { TaskEvent, TaskStatus } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { ocrWithGoogle } from "./gcv";
import { structureInvoiceWithGPT } from "./structure";

function emitTaskEvent(runId: string, step: string, status: TaskStatus, message: string, ref?: string) {
  const event: TaskEvent = {
    id: `evt-${Date.now()}`,
    runId,
    step,
    status,
    message,
    ref,
    ts: Date.now(),
  };
  eventBus.publish(event);
}

interface InvoiceHeader {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  vendorName: string;
  billTo: string | null;
  poNumber: string | null;
  currency: string;
  subtotal: number | null;
  tax: number | null;
  total: number;
}

interface InvoiceLineItem {
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number;
}

interface StructuredInvoice {
  header: InvoiceHeader;
  lineItems: InvoiceLineItem[];
}

const VALID_CURRENCIES = ["USD", "AED", "INR", "SGD"];
const DEFAULT_THRESHOLD = 0.85;

export async function processInvoice(fileId: string, runId?: string) {
  const effectiveRunId = runId || uuidv4();
  const taskId = `process-${fileId}`;

  try {
    // Step 1: Deduplicate by SHA256
    emitTaskEvent(effectiveRunId, "dedupe", "queued", "Checking for duplicates...");
    emitTaskEvent(effectiveRunId, "dedupe", "running", "Checking for duplicates...");

    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fileError || !file) {
      throw new Error(`File not found: ${fileId}`);
    }

    const { data: duplicates } = await supabase
      .from("files")
      .select("id")
      .eq("sha256", file.sha256)
      .neq("id", fileId)
      .limit(1);

    if (duplicates && duplicates.length > 0) {
      emitTaskEvent(effectiveRunId, "dedupe", "done", "Skipped (duplicate)");
      return { skipped: true, reason: "duplicate" };
    }

    // Step 2: OCR with Google Vision
    emitTaskEvent(effectiveRunId, "ocr", "running", "Running OCR with Google Vision...");

    let rawText: string;
    try {
      rawText = await ocrWithGoogle(fileId);
      emitTaskEvent(effectiveRunId, "ocr", "done", `Extracted ${rawText.length} characters`);
    } catch (error) {
      emitTaskEvent(effectiveRunId, "ocr", "error", error instanceof Error ? error.message : "OCR failed");
      throw error;
    }

    // Save extraction record (Fix #1: user_id is now required)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: extraction, error: extractionError } = await supabase
      .from("extractions")
      .insert({
        file_id: fileId,
        user_id: user.id,
        method: "gcv",
        status: "pending",
        raw_text_ref: rawText,
      })
      .select()
      .single();

    if (extractionError) throw extractionError;

    // Step 3: Structure with GPT-5
    emitTaskEvent(effectiveRunId, "structure", "running", "Structuring with GPT-5...");

    let structured: StructuredInvoice;
    try {
      structured = await structureInvoiceWithGPT(extraction.id, rawText);
      emitTaskEvent(effectiveRunId, "structure", "done", "Invoice structured successfully");
    } catch (error) {
      emitTaskEvent(effectiveRunId, "structure", "error", error instanceof Error ? error.message : "Structuring failed");
      throw error;
    }

    // Step 4: Validate and score
    emitTaskEvent(effectiveRunId, "validate", "running", "Validating invoice...");

    let score = 0;
    const { header, lineItems } = structured;

    // +0.25 for invoiceNumber
    if (header.invoiceNumber && header.invoiceNumber.trim()) {
      score += 0.25;
    }

    // +0.25 for total > 0
    if (header.total && header.total > 0) {
      score += 0.25;
    }

    // +0.25 for line items sum matching total (within 2%)
    if (lineItems && lineItems.length > 0 && header.total) {
      const lineSum = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const diff = Math.abs(lineSum - header.total);
      const tolerance = header.total * 0.02;
      if (diff <= tolerance) {
        score += 0.25;
      }
    }

    // +0.25 for valid invoiceDate and currency
    if (header.invoiceDate && header.currency && VALID_CURRENCIES.includes(header.currency)) {
      score += 0.25;
    }

    const threshold = DEFAULT_THRESHOLD;
    const isPaused = score < threshold;

    if (isPaused) {
      // Create exceptions
      const exceptions: string[] = [];
      if (!header.invoiceNumber) exceptions.push("Missing invoice number");
      if (!header.total || header.total <= 0) exceptions.push("Invalid total");
      if (!header.invoiceDate) exceptions.push("Missing invoice date");
      if (!header.currency || !VALID_CURRENCIES.includes(header.currency))
        exceptions.push("Invalid currency");

      emitTaskEvent(effectiveRunId, "validate", "error", `Validation failed (score: ${score}). Paused.`);
      return { paused: true, score, exceptions };
    }

    emitTaskEvent(effectiveRunId, "validate", "done", `Validation passed (score: ${score})`);

    // Step 5: Ingest (idempotent upsert)
    emitTaskEvent(effectiveRunId, "ingest", "running", "Saving invoice to database...");

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .upsert(
        {
          file_id: fileId,
          user_id: user.id,
          doctype: null,
          invoice_number: header.invoiceNumber || null,
          invoice_date: header.invoiceDate || null,
          due_date: header.dueDate || null,
          vendor_name: header.vendorName || null,
          bill_to: header.billTo || null,
          po_number: header.poNumber || null,
          currency: header.currency || "USD",
          subtotal: header.subtotal || null,
          tax: header.tax || null,
          total: header.total || null,
          confidence: score,
        },
        { onConflict: "file_id" }
      )
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Insert line items (Fix #1: user_id is now required)
    if (lineItems && lineItems.length > 0) {
      const lineItemRecords = lineItems.map((item) => ({
        invoice_id: invoice.id,
        user_id: user.id,
        description: item.description || null,
        quantity: item.quantity || null,
        unit_price: item.unitPrice || null,
        amount: item.amount || null,
      }));

      await supabase.from("invoice_line_items").insert(lineItemRecords);
    }

    emitTaskEvent(effectiveRunId, "ingest", "done", "Invoice saved successfully");

    // Step 6: Export CSV & JSON
    emitTaskEvent(effectiveRunId, "export", "running", "Exporting CSV & JSON...");

    try {
      // Generate CSV
      const csvHeader = "Field,Value\n";
      const csvRows = [
        `Invoice Number,${header.invoiceNumber}`,
        `Invoice Date,${header.invoiceDate}`,
        `Due Date,${header.dueDate || "N/A"}`,
        `Vendor,${header.vendorName}`,
        `Bill To,${header.billTo || "N/A"}`,
        `PO Number,${header.poNumber || "N/A"}`,
        `Currency,${header.currency}`,
        `Subtotal,${header.subtotal || "N/A"}`,
        `Tax,${header.tax || "N/A"}`,
        `Total,${header.total}`,
      ].join("\n");
      const csvContent = csvHeader + csvRows;

      // Generate JSON
      const jsonContent = JSON.stringify({ invoice, lineItems }, null, 2);

      // Upload to storage
      const csvPath = `${fileId}/invoice.csv`;
      const jsonPath = `${fileId}/invoice.json`;

      await Promise.all([
        supabase.storage
          .from("exports")
          .upload(csvPath, new Blob([csvContent], { type: "text/csv" }), {
            upsert: true,
            contentType: "text/csv",
          }),
        supabase.storage
          .from("exports")
          .upload(jsonPath, new Blob([jsonContent], { type: "application/json" }), {
            upsert: true,
            contentType: "application/json",
          }),
      ]);

      // Generate signed URLs valid for 24 hours
      const expiresIn = 24 * 60 * 60; // 24 hours in seconds
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      const { data: csvSignedUrl } = await supabase.storage
        .from("exports")
        .createSignedUrl(csvPath, expiresIn);

      const { data: jsonSignedUrl } = await supabase.storage
        .from("exports")
        .createSignedUrl(jsonPath, expiresIn);

      // Store export records with signed URLs (user already fetched earlier)
      await Promise.all([
        supabase.from("exports").insert({
          user_id: user.id,
          invoice_id: invoice.id,
          file_path: csvPath,
          signed_url: csvSignedUrl?.signedUrl,
          expires_at: expiresAt.toISOString(),
        }),
        supabase.from("exports").insert({
          user_id: user.id,
          invoice_id: invoice.id,
          file_path: jsonPath,
          signed_url: jsonSignedUrl?.signedUrl,
          expires_at: expiresAt.toISOString(),
        }),
      ]);

      emitTaskEvent(effectiveRunId, "export", "done", `Secure exports generated (valid 24h)`, csvSignedUrl?.signedUrl);
    } catch (error) {
      emitTaskEvent(effectiveRunId, "export", "error", error instanceof Error ? error.message : "Export failed");
      throw error;
    }

    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    emitTaskEvent(effectiveRunId, "process", "error", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}
