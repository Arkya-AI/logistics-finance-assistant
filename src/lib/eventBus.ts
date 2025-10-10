import { TaskEvent } from "@/types";

type EventCallback = (event: TaskEvent) => void;

class EventBus {
  private subscribers: Map<string, EventCallback[]> = new Map();
  private allSubscribers: EventCallback[] = [];

  subscribe(runId: string, callback: EventCallback): () => void {
    if (!this.subscribers.has(runId)) {
      this.subscribers.set(runId, []);
    }
    this.subscribers.get(runId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(runId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  subscribeAll(callback: EventCallback): () => void {
    this.allSubscribers.push(callback);
    return () => {
      const index = this.allSubscribers.indexOf(callback);
      if (index > -1) {
        this.allSubscribers.splice(index, 1);
      }
    };
  }

  publish(event: TaskEvent): void {
    // Notify run-specific subscribers
    const callbacks = this.subscribers.get(event.runId);
    if (callbacks) {
      callbacks.forEach((cb) => cb(event));
    }

    // Notify global subscribers
    this.allSubscribers.forEach((cb) => cb(event));
  }
}

export const eventBus = new EventBus();
