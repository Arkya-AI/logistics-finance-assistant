export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  ts: number;
}

export type TaskStatus = "queued" | "running" | "done" | "error";

export interface TaskEvent {
  id: string;
  runId: string;
  step: string;
  status: TaskStatus;
  message: string;
  ref?: string;
  ts: number;
}

export interface ParsedField {
  key: string;
  value: string;
  confidence: number; // 0-1
}

export interface CurrentDoc {
  docId: string;
  emailPreviewText: string;
  attachmentName: string;
  parsedFields: ParsedField[];
}

export interface TimelineEntry {
  id: string;
  ts: number;
  message: string;
  toolName?: string;
}

export interface ExceptionItem {
  id: string;
  runId: string;
  field: ParsedField;
  reason: string;
  ts: number;
}

// Re-export email types
export * from "./email";
