const STORAGE_KEY = "lfa_state_v1";
const STATE_VERSION = 1;
const DEBOUNCE_MS = 300;

interface PersistedState {
  version: number;
  messages: any[];
  taskEvents: any[];
  currentDoc: any | null;
  exceptions: any[];
  timeline: any[];
}

let saveTimeout: NodeJS.Timeout | null = null;

export const saveState = (state: Partial<PersistedState>) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    try {
      const persistedState: PersistedState = {
        version: STATE_VERSION,
        messages: state.messages || [],
        taskEvents: state.taskEvents || [],
        currentDoc: state.currentDoc || null,
        exceptions: state.exceptions || [],
        timeline: state.timeline || [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
    } catch (error) {
      console.error("Failed to persist state:", error);
    }
  }, DEBOUNCE_MS);
};

export const loadState = (): Partial<PersistedState> | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    
    // Version check
    if (parsed.version !== STATE_VERSION) {
      console.warn("State version mismatch, clearing storage");
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      messages: parsed.messages || [],
      taskEvents: parsed.taskEvents || [],
      currentDoc: parsed.currentDoc || null,
      exceptions: parsed.exceptions || [],
      timeline: parsed.timeline || [],
    };
  } catch (error) {
    console.error("Failed to load persisted state:", error);
    return null;
  }
};

export const clearPersistedState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear persisted state:", error);
  }
};
