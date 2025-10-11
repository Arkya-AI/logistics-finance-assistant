// Email ingestion types - Messages table schema and related interfaces

export interface EmailMessage {
  id: string; // UUID
  messageId: string; // Gmail/Outlook message ID
  threadId?: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  receivedAt: Date;
  bodyText: string;
  bodyHtml?: string;
  contentHash: string; // SHA-256 for deduplication
  hasAttachments: boolean;
  attachmentCount: number;
  attachmentRefs?: string[]; // storage bucket file paths
  source: "gmail" | "outlook";
  labels?: string[];
  tenantId: string; // for multi-tenant isolation
  createdAt: Date;
  processedAt?: Date;
  status: "pending" | "processed" | "error";
}

export interface EmailAttachment {
  id: string;
  messageId: string;
  filename: string;
  mimeType: string;
  size: number;
  storageUrl: string; // Cloud storage path
  contentHash: string; // SHA-256
  uploadedAt: Date;
}

export interface InboxConfig {
  provider: "gmail" | "outlook";
  pollIntervalMinutes: number;
  email: string;
  // OAuth tokens would be stored securely, not here
  accessTokenRef: string; // reference to secure store
  lastPolledAt?: Date;
  enabled: boolean;
}

export interface PollingResult {
  success: boolean;
  newMessages: number;
  duplicates: number;
  errors: number;
  lastMessageDate?: Date;
}
