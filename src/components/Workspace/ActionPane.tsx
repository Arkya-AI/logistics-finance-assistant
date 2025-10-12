import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { eventBus } from "@/lib/eventBus";
import { useChatStore } from "@/store/chatStore";
import { resumeRunExecution } from "@/lib/agentHandler";
import { createInvoiceMock } from "@/lib/stubTools";

export function ActionPane() {
  const { pendingApproval, clearPendingApproval, addMessage } = useChatStore();

  const handleApprove = async () => {
    if (!pendingApproval) return;

    const { runId, intent } = pendingApproval;

    eventBus.publish({
      id: `evt-approval-${Date.now()}`,
      runId,
      step: "Approval",
      status: "done",
      message: "User approved invoice creation",
      ts: Date.now(),
    });

    clearPendingApproval();
    toast.success("Invoice creation approved");

    // Execute the create invoice step
    const invoice = await createInvoiceMock({ docId: intent.entities.docId || "doc-001", runId });
    const result = `Created invoice ${invoice.invoiceId} from document ${invoice.docId}. Status: ${invoice.status}.`;
    
    addMessage({
      id: `msg-${Date.now()}`,
      role: "assistant",
      text: result,
      ts: Date.now(),
    });
  };

  const handleReject = () => {
    if (!pendingApproval) return;

    const { runId } = pendingApproval;

    eventBus.publish({
      id: `evt-approval-${Date.now()}`,
      runId,
      step: "Approval",
      status: "error",
      message: "User rejected invoice creation",
      ts: Date.now(),
    });

    clearPendingApproval();
    toast.error("Invoice creation rejected");

    addMessage({
      id: `msg-${Date.now()}`,
      role: "assistant",
      text: "Invoice creation was cancelled by user.",
      ts: Date.now(),
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold">Action Pane</h3>
        <p className="text-sm text-muted-foreground">Manual controls and overrides</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {pendingApproval ? (
            <div className="rounded-lg border border-status-warning bg-card p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span className="text-status-warning">⚠️</span>
                Pending Review
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                The agent is waiting for your approval before proceeding with invoice creation.
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
                  Reject
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-4">
              <h4 className="font-medium mb-3">Action Pane</h4>
              <p className="text-sm text-muted-foreground">
                No pending actions. Approval requests will appear here when invoice creation is triggered.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
