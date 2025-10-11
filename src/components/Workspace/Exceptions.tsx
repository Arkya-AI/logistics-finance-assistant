import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfidenceBadge } from "@/components/Badge";
import { useChatStore } from "@/store/chatStore";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { eventBus } from "@/lib/eventBus";
import { resumeRunExecution } from "@/lib/agentHandler";

export function Exceptions() {
  const { exceptions, removeException, updateDocField, currentDoc, resumeRun, addMessage } = useChatStore();
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const handleAcceptAndContinue = async (exception: typeof exceptions[0]) => {
    const finalValue = editValues[exception.id] ?? exception.suggestedValue;
    
    // Update the document field
    updateDocField(exception.fieldKey, finalValue);
    
    // Remove the exception
    removeException(exception.id);
    
    // Publish resolved event
    eventBus.publish({
      id: `evt-resolved-${exception.id}`,
      runId: exception.runId,
      step: "Exception Resolved",
      status: "done",
      message: `Accepted ${exception.fieldKey}: ${finalValue}`,
      ts: Date.now(),
    });
    
    toast.success("Exception resolved");
    
    // Check if no exceptions remain for this run
    const remainingExceptions = exceptions.filter(
      (e) => e.runId === exception.runId && e.id !== exception.id
    );
    
    if (remainingExceptions.length === 0) {
      // Resume the run
      resumeRun(exception.runId);
      
      // Get paused run info and continue execution
      const pausedRun = useChatStore.getState().pausedRuns.get(exception.runId);
      if (pausedRun) {
        await resumeRunExecution(exception.runId, pausedRun.intent, pausedRun.step, addMessage);
      }
    }
  };

  const handleDismiss = (exception: typeof exceptions[0]) => {
    // Remove the exception
    removeException(exception.id);
    
    // Publish dismissed event
    eventBus.publish({
      id: `evt-dismissed-${exception.id}`,
      runId: exception.runId,
      step: "Exception Dismissed",
      status: "done",
      message: `Dismissed ${exception.fieldKey}`,
      ts: Date.now(),
    });
    
    toast.info("Exception dismissed");
    
    // Check if no exceptions remain for this run
    const remainingExceptions = exceptions.filter(
      (e) => e.runId === exception.runId && e.id !== exception.id
    );
    
    if (remainingExceptions.length === 0) {
      // Resume only if all exceptions are resolved
      resumeRun(exception.runId);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold">Exceptions</h3>
        <p className="text-sm text-muted-foreground">
          Low-confidence items requiring review
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {exceptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No exceptions to review
            </p>
          ) : (
            exceptions.map((exception) => (
              <div
                key={exception.id}
                className="rounded-lg border border-status-warning bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-status-warning flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{exception.fieldKey}</span>
                      <ConfidenceBadge confidence={exception.confidence} />
                    </div>
                    <p className="text-xs text-muted-foreground">{exception.reason}</p>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Edit Value:
                      </label>
                      <Input
                        value={editValues[exception.id] ?? exception.suggestedValue}
                        onChange={(e) =>
                          setEditValues({ ...editValues, [exception.id]: e.target.value })
                        }
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAcceptAndContinue(exception)}
                        size="sm"
                        className="flex-1"
                      >
                        Accept and Continue
                      </Button>
                      <Button
                        onClick={() => handleDismiss(exception)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
