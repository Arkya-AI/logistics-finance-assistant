import { useChatStore } from "@/store/chatStore";

let runIdCounter = 0;

export function generateRunId(): string {
  return `run-${Date.now()}-${runIdCounter++}`;
}

export function getActiveRunId(): string {
  const activeRunId = useChatStore.getState().activeRunId;
  return activeRunId || "no-active-run";
}
