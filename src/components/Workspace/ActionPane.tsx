import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { eventBus } from "@/lib/eventBus";

export function ActionPane() {
  const handleApprove = () => {
    eventBus.publish({
      id: `evt-action-${Date.now()}`,
      runId: "manual-action",
      step: "Manual Action",
      status: "done",
      message: "User approved the current action",
      ts: Date.now(),
    });
    toast.success("Action approved");
  };

  const handleReject = () => {
    eventBus.publish({
      id: `evt-action-${Date.now()}`,
      runId: "manual-action",
      step: "Manual Action",
      status: "error",
      message: "User rejected the current action",
      ts: Date.now(),
    });
    toast.error("Action rejected");
  };

  const handleRetry = () => {
    eventBus.publish({
      id: `evt-action-${Date.now()}`,
      runId: "manual-action",
      step: "Manual Action",
      status: "running",
      message: "Retrying last action...",
      ts: Date.now(),
    });
    toast.info("Retrying action...");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold">Action Pane</h3>
        <p className="text-sm text-muted-foreground">Manual controls and overrides</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium mb-3">Current Action</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Review the agent's proposed action and choose to approve, reject, or retry.
            </p>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleApprove}
                className="w-full justify-start gap-2"
                variant="default"
              >
                <CheckCircle className="h-4 w-4" />
                Approve and Continue
              </Button>

              <Button
                onClick={handleReject}
                className="w-full justify-start gap-2"
                variant="destructive"
              >
                <XCircle className="h-4 w-4" />
                Reject Action
              </Button>

              <Button
                onClick={handleRetry}
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <RotateCw className="h-4 w-4" />
                Retry Last Step
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-status-warning bg-card p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <span className="text-status-warning">⚠️</span>
              Pending Review
            </h4>
            <p className="text-sm text-muted-foreground">
              The agent is waiting for your approval before proceeding with invoice creation.
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
