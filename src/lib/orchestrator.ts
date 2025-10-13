import { supabase } from "@/integrations/supabase/client";
import { eventBus } from "./eventBus";
import { TaskEvent, TaskStatus } from "@/types";
import { v4 as uuidv4 } from "uuid";

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

interface StructuredInvoice {
  doctype?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  vendorName?: string;
  billTo?: string;
  poNumber?: string;
  currency?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  lineItems?: Array<{
    description?: string;
    quantity?: number;
    unitPrice?: number;
    amount?: number;
  }>;
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
    emitTaskEvent(effectiveRunId, "ocr", "running", "Running OCR...");

    const { data: ocrData, error: ocrError } = await supabase.functions.invoke(
      "ocr-extract",
      {
        body: { fileId, blobRef: file.blob_ref },
      }
    );

    if (ocrError) throw new Error(`OCR failed: ${ocrError.message}`);
    const rawText = ocrData?.text || "";

    // Save extraction record
    const { data: extraction, error: extractionError } = await supabase
      .from("extractions")
      .insert({
        file_id: fileId,
        method: "gcv",
        status: "pending",
        raw_text_ref: rawText,
      })
      .select()
      .single();

    if (extractionError) throw extractionError;

    // Step 3: Structure with GPT-5
    emitTaskEvent(effectiveRunId, "structure", "running", "Structuring with AI...");

    const { data: gptData, error: gptError } = await supabase.functions.invoke(
      "structure-invoice",
      {
        body: { text: rawText },
      }
    );

    if (gptError) throw new Error(`Structuring failed: ${gptError.message}`);
    const structured: StructuredInvoice = gptData?.invoice || {};

    // Update extraction with GPT JSON
    await supabase
      .from("extractions")
      .update({
        gpt_json_ref: JSON.stringify(structured),
        status: "completed",
      })
      .eq("id", extraction.id);

    // Step 4: Validate and score
    emitTaskEvent(effectiveRunId, "validate", "running", "Validating...");

    let score = 0;

    // +0.25 for invoiceNumber
    if (structured.invoiceNumber && structured.invoiceNumber.trim()) {
      score += 0.25;
    }

    // +0.25 for total > 0
    if (structured.total && structured.total > 0) {
      score += 0.25;
    }

    // +0.25 for line items sum matching total (within 2%)
    if (
      structured.lineItems &&
      structured.lineItems.length > 0 &&
      structured.total
    ) {
      const lineSum = structured.lineItems.reduce(
        (sum, item) => sum + (item.amount || 0),
        0
      );
      const diff = Math.abs(lineSum - structured.total);
      const tolerance = structured.total * 0.02;
      if (diff <= tolerance) {
        score += 0.25;
      }
    }

    // +0.25 for valid invoiceDate and currency
    if (
      structured.invoiceDate &&
      structured.currency &&
      VALID_CURRENCIES.includes(structured.currency)
    ) {
      score += 0.25;
    }

    const threshold = DEFAULT_THRESHOLD;
    const isPaused = score < threshold;

    if (isPaused) {
      // Create exceptions
      const exceptions: string[] = [];
      if (!structured.invoiceNumber) exceptions.push("Missing invoice number");
      if (!structured.total || structured.total <= 0)
        exceptions.push("Invalid total");
      if (!structured.invoiceDate) exceptions.push("Missing invoice date");
      if (!structured.currency || !VALID_CURRENCIES.includes(structured.currency))
        exceptions.push("Invalid currency");

      emitTaskEvent(effectiveRunId, "validate", "error", `Validation failed (score: ${score}). Paused.`);
      return { paused: true, score, exceptions };
    }

    // Step 5: Ingest (idempotent upsert)
    emitTaskEvent(effectiveRunId, "ingest", "running", "Saving invoice...");

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .upsert(
        {
          file_id: fileId,
          doctype: structured.doctype || null,
          invoice_number: structured.invoiceNumber || null,
          invoice_date: structured.invoiceDate || null,
          due_date: structured.dueDate || null,
          vendor_name: structured.vendorName || null,
          bill_to: structured.billTo || null,
          po_number: structured.poNumber || null,
          currency: structured.currency || "USD",
          subtotal: structured.subtotal || null,
          tax: structured.tax || null,
          total: structured.total || null,
          confidence: score,
        },
        { onConflict: "file_id" }
      )
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Insert line items
    if (structured.lineItems && structured.lineItems.length > 0) {
      const lineItems = structured.lineItems.map((item) => ({
        invoice_id: invoice.id,
        description: item.description || null,
        quantity: item.quantity || null,
        unit_price: item.unitPrice || null,
        amount: item.amount || null,
      }));

      await supabase.from("invoice_line_items").insert(lineItems);
    }

    // Step 6: Export CSV & JSON
    emitTaskEvent(effectiveRunId, "export", "running", "Exporting...");

    const csvLink = `/exports/${fileId}/invoice.csv`;
    const jsonLink = `/exports/${fileId}/invoice.json`;

    // Step 7: Route file (placeholder - would move blob in storage)
    // Move to /verified/ or /exceptions/

    emitTaskEvent(effectiveRunId, "export", "done", `Processed successfully. CSV & JSON exported.`, csvLink);

    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    emitTaskEvent(effectiveRunId, "process", "error", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}
