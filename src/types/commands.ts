export type CommandType = 
  | "summarize_inbox"
  | "create_invoice_from_email"
  | "list_overdue_invoices"
  | "send_payment_reminder"
  | "export_weekly_report"
  | "check_vendor_status";

export interface CommandInput {
  command: CommandType;
  params: Record<string, any>;
  runId: string;
}

export interface CommandOutput {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    recordsAffected?: number;
    duration?: number;
    warnings?: string[];
  };
}

// Command-specific input types
export interface SummarizeInboxInput {
  dateRange?: "today" | "yesterday" | "week" | "month";
  category?: "all" | "finance" | "invoices" | "payments";
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
}

export interface CreateInvoiceFromEmailInput {
  messageId?: string;  // Specific message
  searchCriteria?: {
    subject?: string;
    sender?: string;
    hasAttachment?: boolean;
    keywords?: string[];
  };
  autoApprove?: boolean;
}

export interface ListOverdueInvoicesInput {
  daysOverdue: number;
  vendor?: string;
  amountMin?: number;
  amountMax?: number;
  status?: "all" | "pending" | "partially_paid";
}

export interface SendPaymentReminderInput {
  invoiceId?: string;
  vendor?: string;
  daysOverdue?: number;
  template?: "friendly" | "standard" | "urgent";
}

export interface ExportWeeklyReportInput {
  weekOf?: string;  // ISO date
  format?: "csv" | "excel" | "pdf";
  includeAttachments?: boolean;
}

export interface CheckVendorStatusInput {
  vendorName: string;
  includePending?: boolean;
  includeHistory?: boolean;
}

// Command-specific output types
export interface SummarizeInboxOutput {
  summary: {
    totalEmails: number;
    invoicesReceived: number;
    paymentReminders: number;
    vendorInquiries: number;
    totalAmount?: number;
  };
  highlights: Array<{
    type: "invoice" | "payment" | "inquiry" | "alert";
    message: string;
    messageId?: string;
    priority: "low" | "medium" | "high";
  }>;
  period: {
    start: string;
    end: string;
  };
}

export interface CreateInvoiceFromEmailOutput {
  invoiceId: string;
  documentId: string;
  status: "draft" | "pending_review" | "approved";
  extractedFields: {
    vendor: string;
    amount: number;
    currency: string;
    invoiceNumber?: string;
    dueDate?: string;
    confidence: number;
  };
  requiresReview: boolean;
  reviewReasons?: string[];
}

export interface ListOverdueInvoicesOutput {
  invoices: Array<{
    invoiceId: string;
    vendor: string;
    amount: number;
    currency: string;
    daysOverdue: number;
    originalDueDate: string;
    status: string;
    lastReminderSent?: string;
  }>;
  summary: {
    totalCount: number;
    totalAmount: number;
    averageDaysOverdue: number;
  };
}

export interface SendPaymentReminderOutput {
  sent: boolean;
  recipientEmail: string;
  invoiceId: string;
  templateUsed: string;
  scheduledFor?: string;
}

export interface ExportWeeklyReportOutput {
  fileUrl: string;
  fileName: string;
  format: string;
  recordCount: number;
  generatedAt: string;
}

export interface CheckVendorStatusOutput {
  vendor: {
    name: string;
    totalInvoices: number;
    totalAmount: number;
    averagePaymentDays: number;
    lastInteraction: string;
  };
  pending: Array<{
    invoiceId: string;
    amount: number;
    daysOutstanding: number;
  }>;
  recentHistory: Array<{
    date: string;
    action: string;
    amount?: number;
  }>;
  healthScore: "good" | "warning" | "critical";
}

export interface CommandError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}
