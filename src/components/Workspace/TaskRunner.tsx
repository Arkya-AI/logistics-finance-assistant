import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/Badge";
import { useChatStore } from "@/store/chatStore";
import { eventBus } from "@/lib/eventBus";
import { RotateCw } from "lucide-react";
import { toast } from "sonner";

interface TaskRunnerProps {
  onTabSwitch?: (tab: string) => void;
}

export function TaskRunner({ onTabSwitch }: TaskRunnerProps) {
  const { taskEvents, addTaskEvent, lastFailedStep, setLastFailedStep } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = eventBus.subscribeAll((event) => {
      addTaskEvent(event);
      
      // Show toast notifications for key events
      if (event.status === "done" && event.step !== "PLAN") {
        toast.success(event.message, {
          duration: 3000,
        });
      } else if (event.status === "error") {
        toast.error(event.message, {
          duration: 5000,
        });
      } else if (event.step === "PLAN" && event.status === "running") {
        toast.info("Starting job...", {
          duration: 2000,
        });
      }
    });

    return unsubscribe;
  }, [addTaskEvent]);

  // Auto-scroll to bottom when new events are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [taskEvents]);

  const handleEventClick = (event: typeof taskEvents[0]) => {
    if (!onTabSwitch) return;

    const text = `${event.step} ${event.message}`.toLowerCase();

    if (text.includes("ocr") || text.includes("doc")) {
      onTabSwitch("doc");
    } else if (
      text.includes("normalize") ||
      text.includes("low confidence") ||
      text.includes("exception")
    ) {
      onTabSwitch("exceptions");
    } else if (text.includes("invoice") || text.includes("approval")) {
      onTabSwitch("actions");
    }
  };

  const handleRetryStep = () => {
    if (!lastFailedStep) return;
    
    toast.info(`Retrying ${lastFailedStep.tool}...`);
    setLastFailedStep(null);
    
    // Mock: publish a success event for demo purposes
    setTimeout(() => {
      eventBus.publish({
        id: `evt-retry-${Date.now()}`,
        runId: lastFailedStep.runId,
        step: lastFailedStep.step,
        status: "done",
        message: `${lastFailedStep.tool} succeeded on retry`,
        ts: Date.now(),
      });
      toast.success("Step completed successfully");
    }, 1000);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Task Runner</h3>
            <p className="text-sm text-muted-foreground">Live execution steps</p>
          </div>
          {lastFailedStep && (
            <Button
              onClick={handleRetryStep}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <RotateCw className="h-4 w-4" />
              Retry Step
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3" ref={scrollRef}>
          {taskEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No tasks yet. Send a message to get started.
            </p>
          ) : (
            taskEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="rounded-lg border bg-card p-3 transition-all hover:shadow-sm cursor-pointer hover:bg-accent"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{event.step}</span>
                      <StatusBadge status={event.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{event.message}</p>
                    {event.ref && (
                      <p className="text-xs text-primary mt-1">Ref: {event.ref}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(event.ts).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
