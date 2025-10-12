import { ChatMessage, TaskEvent } from "@/types";
import { eventBus } from "./eventBus";
import {
  ingestEmailMock,
  runOcrMock,
  normalizeFieldsMock,
  summarizeInboxMock,
  createInvoiceMock,
  sendReminderMock,
  exportWeeklyMock,
} from "./stubTools";

let runIdCounter = 0;

function generateRunId(): string {
  return `run-${Date.now()}-${runIdCounter++}`;
}

interface Intent {
  action: string;
  entities: Record<string, string>;
}

function parseIntent(text: string): Intent {
  const lower = text.toLowerCase();
  
  if (lower.includes("summarize") || lower.includes("summary")) {
    return { action: "summarize", entities: { range: "last 7 days" } };
  }
  if (lower.includes("create invoice") || lower.includes("new invoice")) {
    return { action: "create", entities: { docId: "doc-001" } };
  }
  if (lower.includes("list") || lower.includes("show")) {
    return { action: "list", entities: {} };
  }
  if (lower.includes("send reminder") || lower.includes("remind")) {
    return { action: "send", entities: { vendor: "Acme Corp", days: "30" } };
  }
  if (lower.includes("export") || lower.includes("report")) {
    return { action: "export", entities: { range: "this week" } };
  }
  if (lower.includes("ingest") || lower.includes("fetch emails")) {
    return { action: "ingest", entities: { sinceTs: String(Date.now() - 86400000 * 7) } };
  }
  if (lower.includes("process") || lower.includes("ocr")) {
    return { action: "process", entities: { docId: "doc-001" } };
  }
  
  return { action: "unknown", entities: {} };
}

async function executePlan(intent: Intent, runId: string, addException: any, pauseRun: any, setPendingApproval: any): Promise<string> {
  let result = "";

  switch (intent.action) {
    case "summarize": {
      const data = await summarizeInboxMock({ range: intent.entities.range || "last 7 days", runId });
      result = `Inbox summary (${data.range}): ${data.summary}. Total emails: ${data.totalEmails}.`;
      break;
    }
    case "create": {
      await runOcrMock({ docId: intent.entities.docId || "doc-001", runId });
      const normalized = await normalizeFieldsMock({ 
        docId: intent.entities.docId || "doc-001", 
        runId, 
        addException, 
        pauseRun 
      });
      
      // If paused, don't continue to invoice creation
      if (normalized.paused) {
        result = "Document processing paused due to low-confidence fields. Please review exceptions.";
        break;
      }
      
      // Pause for approval before creating invoice
      eventBus.publish({
        id: `evt-approval-${runId}`,
        runId,
        step: "Awaiting Approval",
        status: "paused",
        message: "Waiting for user approval to create invoice...",
        ts: Date.now(),
      });
      setPendingApproval(runId, intent, "Create Invoice");
      result = "Invoice creation pending approval. Please review in the Action Pane.";
      break;
    }
    case "send": {
      await sendReminderMock({
        vendor: intent.entities.vendor,
        days: Number(intent.entities.days) || 30,
        runId,
      });
      result = `Sent ${intent.entities.days || 30}-day reminder to ${intent.entities.vendor || "vendor"}.`;
      break;
    }
    case "export": {
      const data = await exportWeeklyMock({ range: intent.entities.range || "this week", runId });
      result = `Exported ${data.rows} records to ${data.file} for ${data.range}.`;
      break;
    }
    case "ingest": {
      const data = await ingestEmailMock({ sinceTs: Number(intent.entities.sinceTs), runId });
      result = `Ingested ${data.count} new emails from inbox.`;
      break;
    }
    case "process": {
      await runOcrMock({ docId: intent.entities.docId || "doc-001", runId });
      const normalized = await normalizeFieldsMock({ 
        docId: intent.entities.docId || "doc-001", 
        runId, 
        addException, 
        pauseRun 
      });
      
      // If paused, don't mark as fully processed
      if (normalized.paused) {
        result = "Document processing paused due to low-confidence fields. Please review exceptions.";
        break;
      }
      
      result = `Processed document ${intent.entities.docId || "doc-001"} successfully.`;
      break;
    }
    default:
      result = "I'm not sure how to help with that. Try asking me to summarize, create invoice, send reminder, export, or process a document.";
  }

  return result;
}

export async function handleUserMessage(
  text: string,
  addMessage: (msg: ChatMessage) => void,
  addException: any,
  pauseRun: any,
  setPendingApproval: any
): Promise<void> {
  const runId = generateRunId();
  const intent = parseIntent(text);

  // Emit a "plan" event
  eventBus.publish({
    id: `evt-plan-${runId}`,
    runId,
    step: "Plan",
    status: "done",
    message: `Intent: ${intent.action}, Entities: ${JSON.stringify(intent.entities)}`,
    ts: Date.now(),
  });

  // Execute the plan
  const assistantReply = await executePlan(intent, runId, addException, pauseRun, setPendingApproval);

  // Add assistant message
  addMessage({
    id: `msg-${Date.now()}`,
    role: "assistant",
    text: assistantReply,
    ts: Date.now(),
  });
}

export async function resumeRunExecution(
  runId: string,
  intent: any,
  step: string,
  addMessage: (msg: ChatMessage) => void
): Promise<void> {
  eventBus.publish({
    id: `evt-resume-${runId}`,
    runId,
    step: "Resume",
    status: "running",
    message: `Resuming from ${step}...`,
    ts: Date.now(),
  });

  // Continue with invoice creation after normalize was paused
  if (intent.action === "create" && step === "Normalize Fields") {
    const invoice = await createInvoiceMock({ docId: intent.entities.docId || "doc-001", runId });
    const result = `Created invoice ${invoice.invoiceId} from document ${invoice.docId}. Status: ${invoice.status}.`;
    
    addMessage({
      id: `msg-${Date.now()}`,
      role: "assistant",
      text: result,
      ts: Date.now(),
    });
  } else if (intent.action === "process" && step === "Normalize Fields") {
    const result = `Processed document ${intent.entities.docId || "doc-001"} successfully.`;
    
    addMessage({
      id: `msg-${Date.now()}`,
      role: "assistant",
      text: result,
      ts: Date.now(),
    });
  }
}
