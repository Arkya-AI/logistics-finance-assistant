import { TimelineEntry } from "@/types";
import { useChatStore } from "@/store/chatStore";

// Normalized tool labels
export const TOOL_LABELS = {
  PLAN: "PLAN",
  OCR: "OCR",
  NORMALIZE: "NORMALIZE",
  APPROVAL: "APPROVAL",
  EXCEPTION: "EXCEPTION",
  INVOICE: "INVOICE",
  SUMMARY: "SUMMARY",
  EXPORT: "EXPORT",
  USER_EDIT: "USER_EDIT",
} as const;

export type ToolLabel = typeof TOOL_LABELS[keyof typeof TOOL_LABELS];

interface TimelineParams {
  runId: string;
  tool: ToolLabel;
  status: "done" | "error";
  message: string;
  ts?: number;
}

export function addTimelineEntry({ runId, tool, status, message, ts }: TimelineParams): void {
  const entry: TimelineEntry = {
    id: `tl-${runId}-${tool}-${Date.now()}`,
    ts: ts || Date.now(),
    message,
    toolName: tool,
  };

  useChatStore.getState().addTimelineEntry(entry);
}
