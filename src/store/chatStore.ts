import { create } from "zustand";
import { ChatMessage, TaskEvent, CurrentDoc, TimelineEntry, ExceptionItem } from "@/types";
import { loadState, saveState } from "@/lib/persist";

export type RunState = 'idle' | 'planning' | 'running' | 'paused:exception' | 'pending:approval' | 'done';

interface ChatStore {
  messages: ChatMessage[];
  taskEvents: TaskEvent[];
  currentDoc: CurrentDoc | null;
  timeline: TimelineEntry[];
  exceptions: ExceptionItem[];
  pausedRuns: Map<string, { intent: any; step: string }>;
  pendingApproval: { runId: string; intent: any; step: string } | null;
  runState: RunState;
  isResuming: boolean;
  activeRunId: string | null;
  
  addMessage: (message: ChatMessage) => void;
  addTaskEvent: (event: TaskEvent) => void;
  setCurrentDoc: (doc: CurrentDoc | null) => void;
  addTimelineEntry: (entry: TimelineEntry) => void;
  addException: (exception: ExceptionItem) => void;
  removeException: (id: string) => void;
  updateDocField: (fieldKey: string, newValue: string) => void;
  pauseRun: (runId: string, intent: any, step: string) => void;
  resumeRun: (runId: string) => void;
  isPaused: (runId: string) => boolean;
  setPendingApproval: (runId: string, intent: any, step: string) => void;
  clearPendingApproval: () => void;
  setRunState: (state: RunState) => void;
  setIsResuming: (isResuming: boolean) => void;
  setActiveRunId: (runId: string | null) => void;
}

// Load persisted state
const persistedState = loadState();

export const useChatStore = create<ChatStore>((set, get) => {
  const store = {
    messages: persistedState?.messages || [],
    taskEvents: persistedState?.taskEvents || [],
    currentDoc: persistedState?.currentDoc || {
      docId: "doc-001",
      emailPreviewText: "Subject: Invoice from Acme Corp\nReceived invoice #2025-001 for services rendered...",
      attachmentName: "invoice_acme_2025.pdf",
      parsedFields: [
        { key: "Vendor Name", value: "Acme Corp", confidence: 0.45 },
        { key: "Invoice Date", value: "2025-01-15", confidence: 0.92 },
        { key: "Total Amount", value: "$1,250.00", confidence: 0.88 },
        { key: "Due Date", value: "2025-02-15", confidence: 0.95 },
      ],
    },
    timeline: persistedState?.timeline || [],
    exceptions: persistedState?.exceptions || [],
    pausedRuns: new Map(),
    pendingApproval: null,
    runState: 'idle' as RunState,
    isResuming: false,
    activeRunId: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  addTaskEvent: (event) =>
    set((state) => {
      // Add to timeline if done
      if (event.status === "done") {
        const timelineEntry: TimelineEntry = {
          id: `tl-${event.id}`,
          ts: event.ts,
          message: event.message,
          toolName: event.step,
        };
        return {
          taskEvents: [...state.taskEvents, event],
          timeline: [...state.timeline, timelineEntry],
        };
      }
      
      // Check for low-confidence exceptions
      if (event.message.includes("Low confidence") || event.message.includes("⚠️")) {
        // This would be triggered by normalizeFieldsMock
        // In real implementation, this would be populated by the actual field data
      }
      
      return { taskEvents: [...state.taskEvents, event] };
    }),

  setCurrentDoc: (doc) => set({ currentDoc: doc }),

  addTimelineEntry: (entry) =>
    set((state) => ({ timeline: [...state.timeline, entry] })),

  addException: (exception) =>
    set((state) => ({ exceptions: [...state.exceptions, exception] })),

  removeException: (id) =>
    set((state) => ({
      exceptions: state.exceptions.filter((e) => e.id !== id),
    })),

  updateDocField: (fieldKey, newValue) =>
    set((state) => ({
      currentDoc: state.currentDoc
        ? {
            ...state.currentDoc,
            parsedFields: state.currentDoc.parsedFields.map((field) =>
              field.key === fieldKey ? { ...field, value: newValue } : field
            ),
          }
        : null,
    })),

  pauseRun: (runId, intent, step) =>
    set((state) => {
      const newPausedRuns = new Map(state.pausedRuns);
      newPausedRuns.set(runId, { intent, step });
      return { 
        pausedRuns: newPausedRuns,
        runState: 'paused:exception' as RunState
      };
    }),

  resumeRun: (runId) =>
    set((state) => {
      const newPausedRuns = new Map(state.pausedRuns);
      newPausedRuns.delete(runId);
      return { pausedRuns: newPausedRuns };
    }),

  isPaused: (runId) => get().pausedRuns.has(runId),

  setPendingApproval: (runId, intent, step) =>
    set({ 
      pendingApproval: { runId, intent, step },
      runState: 'pending:approval' as RunState
    }),

  clearPendingApproval: () =>
    set({ pendingApproval: null }),

  setRunState: (state) =>
    set({ runState: state }),

  setIsResuming: (isResuming) =>
    set({ isResuming }),

  setActiveRunId: (activeRunId) =>
    set({ activeRunId }),
  };

  // Subscribe to changes and persist relevant slices
  const persistRelevantState = () => {
    const state = get();
    saveState({
      messages: state.messages,
      taskEvents: state.taskEvents,
      currentDoc: state.currentDoc,
      exceptions: state.exceptions,
      timeline: state.timeline,
    });
  };

  // Set up subscription after store creation
  setTimeout(() => {
    useChatStore.subscribe(persistRelevantState);
  }, 0);

  return store;
});
