import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useChatStore } from "@/store/chatStore";
import { approveAndExecuteInvoice, rejectInvoiceCreation } from "@/lib/agentHandler";

export function ActionPane() {
  const { pendingApproval, clearPendingApproval, addMessage } = useChatStore();

  const handleApprove = async () => {
    if (!pendingApproval) return;

    clearPendingApproval();
    toast.success("Invoice creation approved");

    await approveAndExecuteInvoice(
      pendingApproval.runId,
      pendingApproval.intent,
      addMessage
    );
  };

  const handleReject = async () => {
    if (!pendingApproval) return;

    clearPendingApproval();
    toast.error("Invoice creation rejected");

    await rejectInvoiceCreation(
      pendingApproval.runId,
      addMessage
    );
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
