import { eventBus } from "./eventBus";
import { TaskEvent } from "@/types";

let eventIdCounter = 0;

function generateEventId(): string {
  return `evt-${Date.now()}-${eventIdCounter++}`;
}

function emitEvent(runId: string, step: string, status: TaskEvent["status"], message: string, ref?: string) {
  const event: TaskEvent = {
    id: generateEventId(),
    runId,
    step,
    status,
    message,
    ref,
    ts: Date.now(),
  };
  eventBus.publish(event);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function ingestEmailMock({ sinceTs, runId }: { sinceTs: number; runId: string }) {
  const step = "Ingest Email";
  emitEvent(runId, step, "queued", "Queued email ingestion");
  await delay(300);
  emitEvent(runId, step, "running", "Fetching emails from inbox...");
  await delay(800);
  emitEvent(runId, step, "done", "Ingested 3 new emails", "3-emails");
  return { count: 3, emails: ["email1", "email2", "email3"] };
}

export async function runOcrMock({ docId, runId }: { docId: string; runId: string }) {
  const step = "Run OCR";
  emitEvent(runId, step, "queued", "Queued OCR processing");
  await delay(300);
  emitEvent(runId, step, "running", `Running OCR on document ${docId}...`);
  await delay(1200);
  emitEvent(runId, step, "done", "OCR completed successfully", docId);
  return { docId, text: "Mock extracted text from invoice..." };
}

export async function normalizeFieldsMock({ 
  docId, 
  runId, 
  addException, 
  pauseRun 
}: { 
  docId: string; 
  runId: string;
  addException: (exception: any) => void;
  pauseRun: (runId: string, intent: any, step: string) => void;
}) {
  const step = "Normalize Fields";
  emitEvent(runId, step, "queued", "Queued field normalization");
  await delay(300);
  emitEvent(runId, step, "running", "Normalizing extracted fields...");
  await delay(900);
  
  // Mock fields with varying confidence
  const fields = [
    { key: "Vendor Name", value: "Acme Corp", confidence: 0.45 },
    { key: "Invoice Date", value: "2025-01-15", confidence: 0.92 },
    { key: "Total Amount", value: "$1,250.00", confidence: 0.88 },
  ];
  
  // Check for low-confidence fields
  const lowConfidenceFields = fields.filter((f) => f.confidence < 0.85);
  
  if (lowConfidenceFields.length > 0) {
    for (const field of lowConfidenceFields) {
      // Emit low-confidence warning
      emitEvent(
        runId, 
        step, 
        "running", 
        `Low confidence: ${field.key} (${(field.confidence * 100).toFixed(0)}%)`
      );
      
      // Add exception
      addException({
        id: `exc-${runId}-${field.key}`,
        runId,
        docId,
        fieldKey: field.key,
        suggestedValue: field.value,
        confidence: field.confidence,
        reason: `Confidence ${(field.confidence * 100).toFixed(0)}% is below threshold`,
        ts: Date.now(),
      });
      
      await delay(300);
    }
    
    // Pause the run
    emitEvent(runId, step, "paused", `Paused: ${lowConfidenceFields.length} exception(s) require review`);
    pauseRun(runId, { action: "normalize", docId }, step);
    
    return {
      docId,
      fields,
      paused: true,
    };
  }
  
  emitEvent(runId, step, "done", "Fields normalized successfully", docId);
  return {
    docId,
    fields,
    paused: false,
  };
}

export async function summarizeInboxMock({ range, runId }: { range: string; runId: string }) {
  const step = "Summarize Inbox";
  emitEvent(runId, step, "queued", "Queued inbox summary");
  await delay(300);
  emitEvent(runId, step, "running", `Analyzing emails from ${range}...`);
  await delay(1000);
  emitEvent(runId, step, "done", "Summary generated", "summary-report");
  return {
    range,
    summary: "3 invoices received, 2 payment reminders, 1 vendor inquiry",
    totalEmails: 6,
  };
}

export async function createInvoiceMock({ docId, runId }: { docId: string; runId: string }) {
  const step = "Create Invoice";
  emitEvent(runId, step, "queued", "Queued invoice creation");
  await delay(300);
  emitEvent(runId, step, "running", "Creating invoice from document...");
  await delay(1100);
  emitEvent(runId, step, "done", "Invoice INV-2025-001 created", "INV-2025-001");
  return { invoiceId: "INV-2025-001", docId, status: "draft" };
}

export async function sendReminderMock({
  invoiceId,
  vendor,
  days,
  runId,
}: {
  invoiceId?: string;
  vendor?: string;
  days?: number;
  runId: string;
}) {
  const step = "Send Reminder";
  emitEvent(runId, step, "queued", "Queued reminder");
  await delay(300);
  emitEvent(
    runId,
    step,
    "running",
    `Sending ${days}-day reminder to ${vendor || invoiceId}...`
  );
  await delay(800);
  emitEvent(runId, step, "done", "Reminder sent successfully");
  return { sent: true, recipient: vendor || invoiceId };
}

export async function exportWeeklyMock({ range, runId }: { range: string; runId: string }) {
  const step = "Export Weekly";
  emitEvent(runId, step, "queued", "Queued weekly export");
  await delay(300);
  emitEvent(runId, step, "running", `Generating report for ${range}...`);
  await delay(1000);
  emitEvent(runId, step, "done", "Export completed", "weekly-report.csv");
  return { range, file: "weekly-report.csv", rows: 42 };
}
