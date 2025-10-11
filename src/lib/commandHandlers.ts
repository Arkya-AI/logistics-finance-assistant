import { eventBus } from "./eventBus";
import { TaskEvent } from "@/types";
import {
  CommandOutput,
  SummarizeInboxInput,
  SummarizeInboxOutput,
  CreateInvoiceFromEmailInput,
  CreateInvoiceFromEmailOutput,
  ListOverdueInvoicesInput,
  ListOverdueInvoicesOutput,
  SendPaymentReminderInput,
  SendPaymentReminderOutput,
  ExportWeeklyReportInput,
  ExportWeeklyReportOutput,
  CheckVendorStatusInput,
  CheckVendorStatusOutput,
  CommandError,
} from "@/types/commands";

// Utility: Generate unique event ID
let eventIdCounter = 0;
function generateEventId(): string {
  return `evt-${Date.now()}-${eventIdCounter++}`;
}

// Utility: Emit task event
function emitEvent(
  runId: string,
  step: string,
  status: TaskEvent["status"],
  message: string,
  ref?: string
) {
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

// Utility: Delay helper
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Error factory
function createCommandError(
  code: string,
  message: string,
  retryable = false,
  details?: any
): CommandError {
  return { code, message, retryable, details };
}

/**
 * COMMAND: Summarize Inbox
 * Natural language: "Summarize today's finance inbox"
 * Backend: Query Messages table, aggregate by category, generate summary
 */
export async function summarizeInbox(
  input: SummarizeInboxInput,
  runId: string
): Promise<CommandOutput> {
  const step = "Summarize Inbox";
  
  try {
    emitEvent(runId, step, "queued", "Queued inbox summary");
    await delay(300);

    // Validate input
    if (input.startDate && input.endDate) {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      if (start > end) {
        throw createCommandError(
          "INVALID_DATE_RANGE",
          "Start date must be before end date",
          false,
          { startDate: input.startDate, endDate: input.endDate }
        );
      }
    }

    emitEvent(runId, step, "running", `Analyzing ${input.dateRange || "custom range"} emails...`);
    await delay(800);

    // Pseudocode: Query Messages table
    // const messages = await db.messages.findMany({
    //   where: {
    //     receivedAt: { gte: startDate, lte: endDate },
    //     category: input.category !== 'all' ? input.category : undefined
    //   },
    //   include: { attachments: true, documents: true }
    // });

    // Mock response
    const output: SummarizeInboxOutput = {
      summary: {
        totalEmails: 42,
        invoicesReceived: 8,
        paymentReminders: 3,
        vendorInquiries: 2,
        totalAmount: 15750.50,
      },
      highlights: [
        {
          type: "invoice",
          message: "Large invoice from Acme Corp: $5,200",
          messageId: "msg-001",
          priority: "high",
        },
        {
          type: "alert",
          message: "3 invoices due within 48 hours",
          priority: "high",
        },
        {
          type: "payment",
          message: "Payment confirmation from XYZ Ltd",
          messageId: "msg-023",
          priority: "medium",
        },
      ],
      period: {
        start: input.startDate || new Date().toISOString().split("T")[0],
        end: input.endDate || new Date().toISOString().split("T")[0],
      },
    };

    emitEvent(runId, step, "done", `Summary generated: ${output.summary.totalEmails} emails`, "summary-report");
    
    return {
      success: true,
      data: output,
      metadata: {
        recordsAffected: output.summary.totalEmails,
        duration: 1100,
      },
    };
  } catch (error: any) {
    const cmdError = error as CommandError;
    emitEvent(runId, step, "error", `Failed: ${cmdError.message || error.message}`);
    
    return {
      success: false,
      error: cmdError.message || error.message,
      metadata: { duration: 500 },
    };
  }
}

/**
 * COMMAND: Create Invoice from Email
 * Natural language: "Create invoice from last PO email"
 * Backend: Search Messages, extract document, create Invoice record
 */
export async function createInvoiceFromEmail(
  input: CreateInvoiceFromEmailInput,
  runId: string
): Promise<CommandOutput> {
  const step = "Create Invoice from Email";
  
  try {
    emitEvent(runId, step, "queued", "Queued invoice creation");
    await delay(300);

    // Validate: Must have either messageId or search criteria
    if (!input.messageId && !input.searchCriteria) {
      throw createCommandError(
        "MISSING_INPUT",
        "Must provide either messageId or searchCriteria",
        false
      );
    }

    emitEvent(runId, step, "running", "Searching for email...");
    await delay(500);

    // Pseudocode: Find message
    // let message;
    // if (input.messageId) {
    //   message = await db.messages.findUnique({ where: { id: input.messageId } });
    // } else {
    //   message = await db.messages.findFirst({
    //     where: {
    //       subject: { contains: input.searchCriteria.subject },
    //       sender: input.searchCriteria.sender,
    //       hasAttachment: input.searchCriteria.hasAttachment
    //     },
    //     orderBy: { receivedAt: 'desc' }
    //   });
    // }

    emitEvent(runId, step, "running", "Extracting invoice data from document...");
    await delay(800);

    // Pseudocode: Get OCR results
    // const document = await db.documents.findFirst({ where: { messageId: message.id } });
    // const ocrResults = document.extractedData;

    // Check confidence levels
    const lowConfidenceFields = ["vendorName"]; // Mock
    const requiresReview = lowConfidenceFields.length > 0 || !input.autoApprove;

    if (requiresReview) {
      emitEvent(
        runId,
        step,
        "running",
        `⚠️ Low confidence on ${lowConfidenceFields.length} field(s), requires review`
      );
      await delay(300);
    }

    // Pseudocode: Create invoice
    // const invoice = await db.invoices.create({
    //   data: {
    //     documentId: document.id,
    //     vendor: ocrResults.vendor,
    //     amount: ocrResults.amount,
    //     status: requiresReview ? 'pending_review' : 'draft'
    //   }
    // });

    const output: CreateInvoiceFromEmailOutput = {
      invoiceId: "INV-2025-042",
      documentId: "doc-001",
      status: requiresReview ? "pending_review" : "draft",
      extractedFields: {
        vendor: "Acme Corp",
        amount: 1250.00,
        currency: "USD",
        invoiceNumber: "ACM-2025-001",
        dueDate: "2025-02-15",
        confidence: 0.87,
      },
      requiresReview,
      reviewReasons: requiresReview ? ["Low confidence on vendor name"] : undefined,
    };

    emitEvent(
      runId,
      step,
      "done",
      `Invoice ${output.invoiceId} created (${output.status})`,
      output.invoiceId
    );
    
    return {
      success: true,
      data: output,
      metadata: {
        recordsAffected: 1,
        duration: 1600,
        warnings: output.reviewReasons,
      },
    };
  } catch (error: any) {
    const cmdError = error as CommandError;
    emitEvent(runId, step, "error", `Failed: ${cmdError.message || error.message}`);
    
    return {
      success: false,
      error: cmdError.message || error.message,
    };
  }
}

/**
 * COMMAND: List Overdue Invoices
 * Natural language: "List unpaid invoices > 30 days"
 * Backend: Query Invoices table, filter by due date, return sorted list
 */
export async function listOverdueInvoices(
  input: ListOverdueInvoicesInput,
  runId: string
): Promise<CommandOutput> {
  const step = "List Overdue Invoices";
  
  try {
    emitEvent(runId, step, "queued", "Queued overdue invoice search");
    await delay(300);

    // Validate
    if (input.daysOverdue < 0) {
      throw createCommandError(
        "INVALID_DAYS",
        "daysOverdue must be a positive number",
        false,
        { daysOverdue: input.daysOverdue }
      );
    }

    emitEvent(
      runId,
      step,
      "running",
      `Searching for invoices overdue by ${input.daysOverdue}+ days...`
    );
    await delay(700);

    // Pseudocode: Query invoices
    // const cutoffDate = new Date();
    // cutoffDate.setDate(cutoffDate.getDate() - input.daysOverdue);
    //
    // const invoices = await db.invoices.findMany({
    //   where: {
    //     dueDate: { lt: cutoffDate },
    //     status: { in: ['pending', 'partially_paid'] },
    //     vendor: input.vendor ? { contains: input.vendor } : undefined,
    //     amount: {
    //       gte: input.amountMin,
    //       lte: input.amountMax
    //     }
    //   },
    //   orderBy: { daysOverdue: 'desc' }
    // });

    const output: ListOverdueInvoicesOutput = {
      invoices: [
        {
          invoiceId: "INV-2024-187",
          vendor: "Acme Corp",
          amount: 2500.00,
          currency: "USD",
          daysOverdue: 45,
          originalDueDate: "2024-11-26",
          status: "pending",
          lastReminderSent: "2025-01-02",
        },
        {
          invoiceId: "INV-2024-201",
          vendor: "XYZ Logistics",
          amount: 1800.00,
          currency: "USD",
          daysOverdue: 38,
          originalDueDate: "2024-12-03",
          status: "pending",
        },
        {
          invoiceId: "INV-2024-215",
          vendor: "Global Freight",
          amount: 950.00,
          currency: "USD",
          daysOverdue: 31,
          originalDueDate: "2024-12-10",
          status: "pending",
        },
      ],
      summary: {
        totalCount: 3,
        totalAmount: 5250.00,
        averageDaysOverdue: 38,
      },
    };

    emitEvent(
      runId,
      step,
      "done",
      `Found ${output.summary.totalCount} overdue invoices totaling $${output.summary.totalAmount}`,
      "overdue-list"
    );
    
    return {
      success: true,
      data: output,
      metadata: {
        recordsAffected: output.summary.totalCount,
        duration: 1000,
      },
    };
  } catch (error: any) {
    const cmdError = error as CommandError;
    emitEvent(runId, step, "error", `Failed: ${cmdError.message || error.message}`);
    
    return {
      success: false,
      error: cmdError.message || error.message,
    };
  }
}

/**
 * COMMAND: Send Payment Reminder
 * Natural language: "Send reminder to Acme Corp for invoice INV-123"
 * Backend: Find invoice, compose email, send via provider, log action
 */
export async function sendPaymentReminder(
  input: SendPaymentReminderInput,
  runId: string
): Promise<CommandOutput> {
  const step = "Send Payment Reminder";
  
  try {
    emitEvent(runId, step, "queued", "Queued payment reminder");
    await delay(300);

    // Validate: Must have invoiceId or vendor
    if (!input.invoiceId && !input.vendor) {
      throw createCommandError(
        "MISSING_TARGET",
        "Must provide either invoiceId or vendor",
        false
      );
    }

    emitEvent(runId, step, "running", "Fetching invoice details...");
    await delay(500);

    // Pseudocode: Find invoice and vendor contact
    // const invoice = input.invoiceId 
    //   ? await db.invoices.findUnique({ where: { id: input.invoiceId }, include: { vendor: true } })
    //   : await db.invoices.findFirst({ where: { vendor: { name: input.vendor } }, include: { vendor: true } });
    //
    // if (!invoice.vendor.email) {
    //   throw createCommandError('NO_EMAIL', 'Vendor has no email on file', false);
    // }

    emitEvent(runId, step, "running", "Composing and sending reminder email...");
    await delay(800);

    // Pseudocode: Send email
    // const emailResult = await emailProvider.send({
    //   to: invoice.vendor.email,
    //   subject: `Payment Reminder: Invoice ${invoice.invoiceNumber}`,
    //   template: input.template || 'standard',
    //   data: { invoice, daysOverdue: input.daysOverdue }
    // });
    //
    // await db.invoiceActions.create({
    //   data: {
    //     invoiceId: invoice.id,
    //     action: 'reminder_sent',
    //     template: input.template,
    //     sentAt: new Date()
    //   }
    // });

    const output: SendPaymentReminderOutput = {
      sent: true,
      recipientEmail: "finance@acmecorp.example",
      invoiceId: input.invoiceId || "INV-2024-187",
      templateUsed: input.template || "standard",
    };

    emitEvent(
      runId,
      step,
      "done",
      `Reminder sent to ${output.recipientEmail}`,
      output.invoiceId
    );
    
    return {
      success: true,
      data: output,
      metadata: {
        recordsAffected: 1,
        duration: 1600,
      },
    };
  } catch (error: any) {
    const cmdError = error as CommandError;
    emitEvent(runId, step, "error", `Failed: ${cmdError.message || error.message}`);
    
    return {
      success: false,
      error: cmdError.message || error.message,
    };
  }
}

/**
 * COMMAND: Export Weekly Report
 * Natural language: "Export this week's finance report"
 * Backend: Aggregate data, generate file, upload to storage, return URL
 */
export async function exportWeeklyReport(
  input: ExportWeeklyReportInput,
  runId: string
): Promise<CommandOutput> {
  const step = "Export Weekly Report";
  
  try {
    emitEvent(runId, step, "queued", "Queued weekly export");
    await delay(300);

    const weekOf = input.weekOf || new Date().toISOString().split("T")[0];
    const format = input.format || "csv";

    emitEvent(runId, step, "running", `Aggregating data for week of ${weekOf}...`);
    await delay(700);

    // Pseudocode: Aggregate data
    // const startOfWeek = getStartOfWeek(new Date(weekOf));
    // const endOfWeek = getEndOfWeek(new Date(weekOf));
    //
    // const data = await db.invoices.findMany({
    //   where: { createdAt: { gte: startOfWeek, lte: endOfWeek } },
    //   include: { vendor: true, documents: true }
    // });

    emitEvent(runId, step, "running", `Generating ${format.toUpperCase()} report...`);
    await delay(800);

    // Pseudocode: Generate file
    // const fileContent = generateReport(data, format);
    // const fileName = `finance-report-${weekOf}.${format}`;
    // const fileUrl = await storage.upload(fileName, fileContent);

    const output: ExportWeeklyReportOutput = {
      fileUrl: `https://storage.example.com/reports/finance-report-${weekOf}.${format}`,
      fileName: `finance-report-${weekOf}.${format}`,
      format: format,
      recordCount: 127,
      generatedAt: new Date().toISOString(),
    };

    emitEvent(
      runId,
      step,
      "done",
      `Report generated: ${output.recordCount} records`,
      output.fileName
    );
    
    return {
      success: true,
      data: output,
      metadata: {
        recordsAffected: output.recordCount,
        duration: 1800,
      },
    };
  } catch (error: any) {
    const cmdError = error as CommandError;
    emitEvent(runId, step, "error", `Failed: ${cmdError.message || error.message}`);
    
    return {
      success: false,
      error: cmdError.message || error.message,
    };
  }
}

/**
 * COMMAND: Check Vendor Status
 * Natural language: "Check status of Acme Corp"
 * Backend: Aggregate vendor data, calculate metrics, return health score
 */
export async function checkVendorStatus(
  input: CheckVendorStatusInput,
  runId: string
): Promise<CommandOutput> {
  const step = "Check Vendor Status";
  
  try {
    emitEvent(runId, step, "queued", "Queued vendor status check");
    await delay(300);

    emitEvent(runId, step, "running", `Fetching data for ${input.vendorName}...`);
    await delay(600);

    // Pseudocode: Fetch vendor and aggregate
    // const vendor = await db.vendors.findFirst({ where: { name: { contains: input.vendorName } } });
    // if (!vendor) throw createCommandError('VENDOR_NOT_FOUND', `Vendor "${input.vendorName}" not found`, false);
    //
    // const invoices = await db.invoices.findMany({ where: { vendorId: vendor.id } });
    // const pending = invoices.filter(inv => inv.status === 'pending');
    // const avgPaymentDays = calculateAverage(invoices.map(inv => inv.paymentDays));
    // const healthScore = calculateHealthScore(vendor, invoices);

    const avgPaymentDays = 28; // Mock value
    const healthScore = avgPaymentDays > 45 ? "critical" : 
                        avgPaymentDays > 30 ? "warning" : "good";

    const output: CheckVendorStatusOutput = {
      vendor: {
        name: input.vendorName,
        totalInvoices: 24,
        totalAmount: 45200.00,
        averagePaymentDays: avgPaymentDays,
        lastInteraction: "2025-01-08",
      },
      pending: [
        { invoiceId: "INV-2024-187", amount: 2500.00, daysOutstanding: 45 },
        { invoiceId: "INV-2025-003", amount: 1200.00, daysOutstanding: 12 },
      ],
      recentHistory: [
        { date: "2025-01-08", action: "Invoice received", amount: 1200.00 },
        { date: "2025-01-02", action: "Reminder sent" },
        { date: "2024-12-28", action: "Payment received", amount: 3400.00 },
      ],
      healthScore,
    };

    emitEvent(
      runId,
      step,
      "done",
      `Vendor health: ${output.healthScore.toUpperCase()} (${output.pending.length} pending)`,
      input.vendorName
    );
    
    return {
      success: true,
      data: output,
      metadata: {
        recordsAffected: output.vendor.totalInvoices,
        duration: 900,
      },
    };
  } catch (error: any) {
    const cmdError = error as CommandError;
    emitEvent(runId, step, "error", `Failed: ${cmdError.message || error.message}`);
    
    return {
      success: false,
      error: cmdError.message || error.message,
    };
  }
}
