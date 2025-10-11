/**
 * Email Ingestion Service
 * Polls Gmail/Outlook, deduplicates, stores attachments, writes to Messages table
 * 
 * STUB IMPLEMENTATION - Pseudocode for backend integration
 */

import { eventBus } from "./eventBus";
import { EmailMessage, EmailAttachment, InboxConfig, PollingResult } from "@/types/email";
import { TaskEvent } from "@/types";

// Crypto utility for content hashing (deduplication)
async function generateContentHash(content: string): Promise<string> {
  // STUB: In production, use Web Crypto API or backend
  // const buffer = new TextEncoder().encode(content);
  // const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  // return Array.from(new Uint8Array(hashBuffer))
  //   .map(b => b.toString(16).padStart(2, '0'))
  //   .join('');
  
  // Mock hash for now
  return `hash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// STUB: Gmail API client wrapper
async function fetchGmailMessages(config: InboxConfig, since: Date): Promise<any[]> {
  // PSEUDOCODE:
  // 1. Initialize Gmail API client with OAuth token
  // const gmail = google.gmail({ version: 'v1', auth: oauthClient });
  // 
  // 2. Query messages since last poll
  // const query = `after:${Math.floor(since.getTime() / 1000)} has:attachment`;
  // const response = await gmail.users.messages.list({
  //   userId: 'me',
  //   q: query,
  //   maxResults: 100
  // });
  // 
  // 3. Fetch full message details for each
  // const messages = await Promise.all(
  //   response.data.messages.map(m => 
  //     gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' })
  //   )
  // );
  //
  // 4. Return normalized message data
  
  console.log(`[STUB] Fetching Gmail messages since ${since.toISOString()}`);
  return []; // Mock empty for now
}

// STUB: Outlook API client wrapper
async function fetchOutlookMessages(config: InboxConfig, since: Date): Promise<any[]> {
  // PSEUDOCODE:
  // 1. Initialize Microsoft Graph client with OAuth token
  // const client = Client.init({ authProvider });
  // 
  // 2. Query messages with filter
  // const filter = `receivedDateTime ge ${since.toISOString()} and hasAttachments eq true`;
  // const messages = await client
  //   .api('/me/messages')
  //   .filter(filter)
  //   .top(100)
  //   .get();
  //
  // 3. Return normalized message data
  
  console.log(`[STUB] Fetching Outlook messages since ${since.toISOString()}`);
  return []; // Mock empty for now
}

// STUB: Check if message already exists (deduplication)
async function messageExists(contentHash: string, tenantId: string): Promise<boolean> {
  // PSEUDOCODE - Backend/Supabase query:
  // const { data, error } = await supabase
  //   .from('messages')
  //   .select('id')
  //   .eq('content_hash', contentHash)
  //   .eq('tenant_id', tenantId)
  //   .maybeSingle();
  // 
  // return !!data;
  
  console.log(`[STUB] Checking duplicate for hash: ${contentHash}`);
  return false; // Always new for stub
}

// STUB: Upload attachment to storage backend
async function uploadAttachment(
  file: { name: string; content: Blob | ArrayBuffer; mimeType: string },
  messageId: string,
  tenantId: string
): Promise<EmailAttachment> {
  // PSEUDOCODE - Cloud Storage:
  // const path = `${tenantId}/attachments/${messageId}/${file.name}`;
  // 
  // const { data, error } = await supabase.storage
  //   .from('email-attachments')
  //   .upload(path, file.content, {
  //     contentType: file.mimeType,
  //     upsert: false
  //   });
  //
  // if (error) throw error;
  //
  // const { data: urlData } = supabase.storage
  //   .from('email-attachments')
  //   .getPublicUrl(path);
  
  const contentHash = await generateContentHash(file.name + messageId);
  
  console.log(`[STUB] Uploading attachment: ${file.name} (${file.mimeType})`);
  
  return {
    id: `att-${Date.now()}`,
    messageId,
    filename: file.name,
    mimeType: file.mimeType,
    size: 0, // stub
    storageUrl: `storage://${tenantId}/attachments/${messageId}/${file.name}`,
    contentHash,
    uploadedAt: new Date(),
  };
}

// STUB: Insert message record into Messages table
async function insertMessage(message: EmailMessage): Promise<void> {
  // PSEUDOCODE - Backend/Supabase insert:
  // const { error } = await supabase
  //   .from('messages')
  //   .insert({
  //     id: message.id,
  //     message_id: message.messageId,
  //     thread_id: message.threadId,
  //     subject: message.subject,
  //     from: message.from,
  //     to: message.to,
  //     cc: message.cc,
  //     received_at: message.receivedAt.toISOString(),
  //     body_text: message.bodyText,
  //     body_html: message.bodyHtml,
  //     content_hash: message.contentHash,
  //     has_attachments: message.hasAttachments,
  //     attachment_count: message.attachmentCount,
  //     attachment_refs: message.attachmentRefs,
  //     source: message.source,
  //     labels: message.labels,
  //     tenant_id: message.tenantId,
  //     status: message.status,
  //     created_at: message.createdAt.toISOString()
  //   });
  //
  // if (error) throw error;
  
  console.log(`[STUB] Inserting message to DB:`, {
    id: message.id,
    subject: message.subject,
    from: message.from,
    attachments: message.attachmentCount,
  });
}

// STUB: Update inbox config last polled timestamp
async function updateLastPolled(configId: string, timestamp: Date): Promise<void> {
  // PSEUDOCODE:
  // await supabase
  //   .from('inbox_configs')
  //   .update({ last_polled_at: timestamp.toISOString() })
  //   .eq('id', configId);
  
  console.log(`[STUB] Updated last polled: ${timestamp.toISOString()}`);
}

/**
 * Process a single raw email message:
 * - Generate content hash
 * - Check for duplicates
 * - Upload attachments
 * - Insert message record
 */
async function processRawMessage(
  rawMessage: any,
  config: InboxConfig,
  tenantId: string,
  runId: string
): Promise<EmailMessage | null> {
  try {
    // 1. Extract message data (provider-specific parsing)
    const messageData = {
      messageId: rawMessage.id || rawMessage.messageId,
      threadId: rawMessage.threadId,
      subject: rawMessage.subject || "(no subject)",
      from: rawMessage.from,
      to: rawMessage.to || [],
      cc: rawMessage.cc,
      receivedAt: new Date(rawMessage.receivedAt || rawMessage.date),
      bodyText: rawMessage.bodyText || rawMessage.snippet || "",
      bodyHtml: rawMessage.bodyHtml,
    };
    
    // 2. Generate content hash for deduplication
    const contentToHash = `${messageData.messageId}|${messageData.subject}|${messageData.receivedAt.getTime()}`;
    const contentHash = await generateContentHash(contentToHash);
    
    // 3. Check if already processed (deduplication)
    const isDuplicate = await messageExists(contentHash, tenantId);
    if (isDuplicate) {
      console.log(`[DEDUP] Skipping duplicate message: ${messageData.subject}`);
      return null;
    }
    
    // 4. Process attachments if any
    const attachmentRefs: string[] = [];
    const attachments = rawMessage.attachments || [];
    
    for (const att of attachments) {
      const uploadedAtt = await uploadAttachment(
        {
          name: att.filename,
          content: att.data, // Blob/ArrayBuffer
          mimeType: att.mimeType,
        },
        messageData.messageId,
        tenantId
      );
      attachmentRefs.push(uploadedAtt.storageUrl);
    }
    
    // 5. Construct EmailMessage record
    const emailMessage: EmailMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...messageData,
      contentHash,
      hasAttachments: attachments.length > 0,
      attachmentCount: attachments.length,
      attachmentRefs: attachmentRefs.length > 0 ? attachmentRefs : undefined,
      source: config.provider,
      tenantId,
      createdAt: new Date(),
      status: "pending",
    };
    
    // 6. Insert to Messages table
    await insertMessage(emailMessage);
    
    return emailMessage;
  } catch (error) {
    console.error(`[ERROR] Failed to process message:`, error);
    
    // Emit error event
    eventBus.publish({
      id: `evt-${Date.now()}`,
      runId,
      step: "Ingest Email",
      status: "error",
      message: `Failed to process message: ${error}`,
      ts: Date.now(),
    });
    
    return null;
  }
}

/**
 * Poll inbox for new messages
 * Main entry point called by scheduler/cron
 */
export async function pollInbox(
  config: InboxConfig,
  tenantId: string,
  runId: string
): Promise<PollingResult> {
  const step = "Ingest Email";
  
  try {
    eventBus.publish({
      id: `evt-${Date.now()}`,
      runId,
      step,
      status: "queued",
      message: `Polling ${config.provider} inbox: ${config.email}`,
      ts: Date.now(),
    });
    
    // 1. Determine polling window
    const sinceDate = config.lastPolledAt || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: 24h ago
    
    eventBus.publish({
      id: `evt-${Date.now()}`,
      runId,
      step,
      status: "running",
      message: `Fetching messages since ${sinceDate.toISOString()}...`,
      ts: Date.now(),
    });
    
    // 2. Fetch messages from provider
    const rawMessages =
      config.provider === "gmail"
        ? await fetchGmailMessages(config, sinceDate)
        : await fetchOutlookMessages(config, sinceDate);
    
    console.log(`[POLL] Retrieved ${rawMessages.length} messages from ${config.provider}`);
    
    // 3. Process each message (dedupe, store attachments, insert)
    let newCount = 0;
    let dupCount = 0;
    let errorCount = 0;
    
    for (const rawMsg of rawMessages) {
      const processed = await processRawMessage(rawMsg, config, tenantId, runId);
      
      if (processed === null) {
        dupCount++;
      } else {
        newCount++;
      }
    }
    
    // 4. Update last polled timestamp
    await updateLastPolled(config.email, new Date());
    
    // 5. Emit completion event
    eventBus.publish({
      id: `evt-${Date.now()}`,
      runId,
      step,
      status: "done",
      message: `Ingested ${newCount} new messages (${dupCount} duplicates skipped)`,
      ref: `${newCount}-messages`,
      ts: Date.now(),
    });
    
    return {
      success: true,
      newMessages: newCount,
      duplicates: dupCount,
      errors: errorCount,
      lastMessageDate: rawMessages[0]?.receivedAt,
    };
  } catch (error) {
    console.error(`[POLL ERROR]`, error);
    
    eventBus.publish({
      id: `evt-${Date.now()}`,
      runId,
      step,
      status: "error",
      message: `Polling failed: ${error}`,
      ts: Date.now(),
    });
    
    return {
      success: false,
      newMessages: 0,
      duplicates: 0,
      errors: 1,
    };
  }
}

/**
 * Background polling service
 * Runs on interval (e.g., every 5 minutes)
 */
export class EmailPollingService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  
  /**
   * Start polling service
   * In production, this would be a backend cron job or edge function scheduler
   */
  start(config: InboxConfig, tenantId: string) {
    if (this.isRunning) {
      console.warn("[POLL SERVICE] Already running");
      return;
    }
    
    console.log(`[POLL SERVICE] Starting with interval: ${config.pollIntervalMinutes} minutes`);
    
    this.isRunning = true;
    
    // Initial poll
    const runId = `poll-${Date.now()}`;
    pollInbox(config, tenantId, runId);
    
    // Set up recurring poll
    this.intervalId = setInterval(() => {
      const runId = `poll-${Date.now()}`;
      pollInbox(config, tenantId, runId);
    }, config.pollIntervalMinutes * 60 * 1000);
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log("[POLL SERVICE] Stopped");
    }
  }
}

/**
 * PRODUCTION DEPLOYMENT NOTES:
 * 
 * 1. Backend Implementation:
 *    - Move polling to Supabase Edge Function or scheduled backend job
 *    - Use cron scheduler (every 5-10 min)
 *    - Store OAuth tokens in encrypted secrets store
 * 
 * 2. Database Schema (Messages table):
 *    CREATE TABLE messages (
 *      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *      message_id TEXT NOT NULL,
 *      thread_id TEXT,
 *      subject TEXT NOT NULL,
 *      "from" TEXT NOT NULL,
 *      "to" TEXT[] NOT NULL,
 *      cc TEXT[],
 *      received_at TIMESTAMPTZ NOT NULL,
 *      body_text TEXT,
 *      body_html TEXT,
 *      content_hash TEXT NOT NULL,
 *      has_attachments BOOLEAN DEFAULT FALSE,
 *      attachment_count INTEGER DEFAULT 0,
 *      attachment_refs TEXT[],
 *      source TEXT NOT NULL CHECK (source IN ('gmail', 'outlook')),
 *      labels TEXT[],
 *      tenant_id UUID NOT NULL REFERENCES tenants(id),
 *      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'error')),
 *      created_at TIMESTAMPTZ DEFAULT NOW(),
 *      processed_at TIMESTAMPTZ,
 *      UNIQUE(content_hash, tenant_id)
 *    );
 *    CREATE INDEX idx_messages_tenant_received ON messages(tenant_id, received_at DESC);
 *    CREATE INDEX idx_messages_hash ON messages(content_hash);
 * 
 * 3. Storage Bucket:
 *    - Create 'email-attachments' bucket with RLS
 *    - Path structure: {tenant_id}/attachments/{message_id}/{filename}
 * 
 * 4. OAuth Setup:
 *    - Gmail: Google Cloud Console → Enable Gmail API → OAuth 2.0
 *    - Outlook: Azure AD → Register app → Microsoft Graph permissions
 *    - Store refresh tokens securely, rotate access tokens
 * 
 * 5. Rate Limiting:
 *    - Gmail: 250 quota units/user/second, 25,000/day
 *    - Outlook: 10,000 requests/10 min/app
 *    - Implement exponential backoff
 */
