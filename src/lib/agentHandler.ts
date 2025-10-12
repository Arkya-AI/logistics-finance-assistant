import { ChatMessage, TaskEvent } from "@/types";
import { eventBus } from "./eventBus";
import { addTimelineEntry, TOOL_LABELS } from "./timelineHelper";
import { generateRunId } from "./runIdHelper";
import {
  ingestEmailMock,
  runOcrMock,
  normalizeFieldsMock,
  summarizeInboxMock,
  createInvoiceMock,
  sendReminderMock,
  exportWeeklyMock,
} from "./stubTools";

interface Intent {
  action: string;
  entities: Record<string, string>;
}

function parseIntent(text: string): Intent {
  const lower = text.toLowerCase();
  
  // Deterministic smoke-test commands
  if (lower === "summarize yesterday") {
    return { action: "test:summarize", entities: {} };
  }
  if (lower === "process doc") {
    return { action: "test:process", entities: {} };
  }
  if (lower === "create invoice") {
    return { action: "test:invoice", entities: {} };
  }
  
  // Regular commands
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
    // Smoke test: "summarize yesterday"
    case "test:summarize": {
      await delay(200);
      const ts1 = Date.now();
      eventBus.publish({
        id: `evt-test-1-${runId}`,
        runId,
        step: "Fetch Emails",
        status: "done",
        message: "Retrieved 12 emails from yesterday",
        ts: ts1,
      });
      addTimelineEntry({ runId, tool: TOOL_LABELS.PLAN, status: "done", message: "Retrieved 12 emails from yesterday", ts: ts1 });
      
      await delay(200);
      const ts2 = Date.now();
      eventBus.publish({
        id: `evt-test-2-${runId}`,
        runId,
        step: "Categorize",
        status: "done",
        message: "Categorized 8 invoices, 4 inquiries",
        ts: ts2,
      });
      addTimelineEntry({ runId, tool: TOOL_LABELS.SUMMARY, status: "done", message: "Categorized 8 invoices, 4 inquiries", ts: ts2 });
      
      await delay(200);
      const ts3 = Date.now();
      eventBus.publish({
        id: `evt-test-3-${runId}`,
        runId,
        step: "Generate Summary",
        status: "done",
        message: "Summary report ready",
        ts: ts3,
      });
      addTimelineEntry({ runId, tool: TOOL_LABELS.SUMMARY, status: "done", message: "Summary report ready", ts: ts3 });
      
      result = "Yesterday: 12 emails, 8 invoices, 4 inquiries. Total amount: $8,450.00";
      break;
    }

    // Smoke test: "process doc"
    case "test:process": {
      await delay(200);
      const ocrTs = Date.now();
      eventBus.publish({
        id: `evt-ocr-${runId}`,
        runId,
        step: "OCR Extraction",
        status: "done",
        message: "Extracted 6 fields from document",
        ts: ocrTs,
      });
      addTimelineEntry({ runId, tool: TOOL_LABELS.OCR, status: "done", message: "Extracted 6 fields from document", ts: ocrTs });
      
      await delay(200);
      // Normalize with low confidence to trigger exception
      addException({
        id: `exc-test-${runId}`,
        runId,
        docId: "doc-001",
        fieldKey: "Vendor Name",
        suggestedValue: "Test Vendor Inc",
        confidence: 0.72,
        reason: "Handwritten text unclear",
        ts: Date.now(),
      });
      
      eventBus.publish({
        id: `evt-norm-${runId}`,
        runId,
        step: "Low confidence: Vendor Name (0.72)",
        status: "paused",
        message: "⚠️ Low confidence field detected",
        ts: Date.now(),
      });
      
      pauseRun(runId, intent, "Normalize Fields");
      result = "Document processing paused due to low-confidence fields. Please review exceptions.";
      break;
    }

    // Smoke test: "create invoice"
    case "test:invoice": {
      await delay(200);
      const prepTs = Date.now();
      eventBus.publish({
        id: `evt-prep-${runId}`,
        runId,
        step: "Prepare Invoice",
        status: "done",
        message: "Invoice data prepared from doc-001",
        ts: prepTs,
      });
      addTimelineEntry({ runId, tool: TOOL_LABELS.INVOICE, status: "done", message: "Invoice data prepared from doc-001", ts: prepTs });
      
      await delay(200);
      eventBus.publish({
        id: `evt-approval-${runId}`,
        runId,
        step: "Awaiting Approval",
        status: "paused",
        message: "Invoice ready for review and approval",
        ts: Date.now(),
      });
      
      setPendingApproval(runId, intent, "Create Invoice");
      result = "Invoice creation pending approval. Please review in the Action Pane.";
      break;
    }

    case "summarize": {
      const data = await summarizeInboxMock({ range: intent.entities.range || "last 7 days", runId });
      result = `Inbox summary (${data.range}): ${data.summary}. Total emails: ${data.totalEmails}.`;
      break;
    }
    case "create": {
      try {
        await runOcrMock({ docId: intent.entities.docId || "doc-001", runId });
      } catch (error) {
        result = `I hit an error on OCR. ${error instanceof Error ? error.message : "Unknown error"}`;
        break;
      }
      
      try {
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
      } catch (error) {
        result = `I hit an error on Normalize. ${error instanceof Error ? error.message : "Unknown error"}`;
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
      try {
        await runOcrMock({ docId: intent.entities.docId || "doc-001", runId });
      } catch (error) {
        result = `I hit an error on OCR. ${error instanceof Error ? error.message : "Unknown error"}`;
        break;
      }
      
      try {
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
      } catch (error) {
        result = `I hit an error on Normalize. ${error instanceof Error ? error.message : "Unknown error"}`;
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

// Utility: Delay helper
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function handleUserMessage(
  text: string,
  addMessage: (msg: ChatMessage) => void,
  addException: any,
  pauseRun: any,
  setPendingApproval: any,
  setActiveRunId: any
): Promise<void> {
  const runId = generateRunId();
  setActiveRunId(runId);
  const intent = parseIntent(text);

  // Handle unknown intent
  if (intent.action === "unknown") {
    const helpMessage = 'I did not recognize that. Try: "summarize yesterday", "process doc", "create invoice".';
    
    eventBus.publish({
      id: `evt-analyze-${runId}`,
      runId,
      step: "Analyze",
      status: "error",
      message: helpMessage,
      ts: Date.now(),
    });
    
    addMessage({
      id: `msg-${Date.now()}`,
      role: "assistant",
      text: helpMessage,
      ts: Date.now(),
    });
    
    return;
  }

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
  // Import store dynamically to avoid circular dependencies
  const { useChatStore } = await import("@/store/chatStore");
  const { runState, isResuming } = useChatStore.getState();
  
  // Idempotence guards
  if (runState !== 'paused:exception' && runState !== 'running') return;
  if (isResuming && runState !== 'running') return;
  
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
  } else if (intent.action === "test:process" && step === "Normalize Fields") {
    await delay(200);
    const completeTs = Date.now();
    eventBus.publish({
      id: `evt-complete-${runId}`,
      runId,
      step: "Processing Complete",
      status: "done",
      message: "Document successfully processed",
      ts: completeTs,
    });
    addTimelineEntry({ runId, tool: TOOL_LABELS.NORMALIZE, status: "done", message: "Document successfully processed", ts: completeTs });
    
    const result = "Document processing complete. All fields validated.";
    addMessage({
      id: `msg-${Date.now()}`,
      role: "assistant",
      text: result,
      ts: Date.now(),
    });
  }
}

export async function approveAndExecuteInvoice(
  runId: string,
  intent: any,
  addMessage: (msg: ChatMessage) => void
): Promise<void> {
  // Import store dynamically to avoid circular dependencies
  const { useChatStore } = await import("@/store/chatStore");
  const { runState, isResuming } = useChatStore.getState();
  
  // Idempotence guards
  if (runState !== 'pending:approval' && runState !== 'running') return;
  if (isResuming && runState !== 'running') return;
  
  const approvalTs = Date.now();
  eventBus.publish({
    id: `evt-approved-${runId}`,
    runId,
    step: "Approval",
    status: "done",
    message: "User approved invoice creation",
    ts: approvalTs,
  });
  addTimelineEntry({ runId, tool: TOOL_LABELS.APPROVAL, status: "done", message: "User approved invoice creation", ts: approvalTs });

  // Smoke test "create invoice" completion
  if (intent.action === "test:invoice") {
    await delay(200);
    const invoiceTs = Date.now();
    eventBus.publish({
      id: `evt-invoice-created-${runId}`,
      runId,
      step: "Invoice Created",
      status: "done",
      message: "Invoice INV-TEST-001 created successfully",
      ts: invoiceTs,
    });
    addTimelineEntry({ runId, tool: TOOL_LABELS.INVOICE, status: "done", message: "Invoice INV-TEST-001 created successfully", ts: invoiceTs });
    
    addMessage({
      id: `msg-${Date.now()}`,
      role: "assistant",
      text: "Invoice INV-TEST-001 created and ready for QuickBooks sync.",
      ts: Date.now(),
    });
  } else {
    // Regular invoice creation
    const invoice = await createInvoiceMock({ docId: intent.entities.docId || "doc-001", runId });
    const result = `Created invoice ${invoice.invoiceId} from document ${invoice.docId}. Status: ${invoice.status}.`;
    
    addMessage({
      id: `msg-${Date.now()}`,
      role: "assistant",
      text: result,
      ts: Date.now(),
    });
  }
}

export async function rejectInvoiceCreation(
  runId: string,
  addMessage: (msg: ChatMessage) => void
): Promise<void> {
  const rejectTs = Date.now();
  eventBus.publish({
    id: `evt-rejected-${runId}`,
    runId,
    step: "Approval",
    status: "error",
    message: "User rejected invoice creation",
    ts: rejectTs,
  });
  addTimelineEntry({ runId, tool: TOOL_LABELS.APPROVAL, status: "error", message: "User rejected invoice creation", ts: rejectTs });
  
  addMessage({
    id: `msg-${Date.now()}`,
    role: "assistant",
    text: "Invoice creation cancelled per your request.",
    ts: Date.now(),
  });
}
