import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, FileQuestion } from "lucide-react";
import { toast } from "sonner";
import { useChatStore } from "@/store/chatStore";
import { approveAndExecuteInvoice, rejectInvoiceCreation } from "@/lib/agentHandler";

export function ActionPane() {
  const { 
    pendingApproval, 
    clearPendingApproval, 
    addMessage,
    runState,
    isResuming,
    setIsResuming,
    setRunState
  } = useChatStore();
  
  const [buttonsDisabled, setButtonsDisabled] = useState(false);

  // Re-enable buttons on error
  useEffect(() => {
    if (runState === 'idle' && buttonsDisabled) {
      setButtonsDisabled(false);
    }
  }, [runState, buttonsDisabled]);

  const handleApprove = async () => {
    // Idempotence guards
    if (runState !== 'pending:approval') return;
    if (isResuming) return;
    if (!pendingApproval) return;

    setButtonsDisabled(true);
    setIsResuming(true);
    clearPendingApproval();
    setRunState('running');
    toast.success("Invoice creation approved");

    try {
      await approveAndExecuteInvoice(
        pendingApproval.runId,
        pendingApproval.intent,
        addMessage
      );
      
      setRunState('done');
    } catch (error) {
      toast.error("Approval failed");
      setRunState('idle');
    } finally {
      setIsResuming(false);
      // Re-enable after 2s timeout or completion
      setTimeout(() => setButtonsDisabled(false), 2000);
    }
  };

  const handleReject = async () => {
    // Idempotence guards
    if (runState !== 'pending:approval') return;
    if (isResuming) return;
    if (!pendingApproval) return;

    setButtonsDisabled(true);
    setIsResuming(true);
    clearPendingApproval();
    setRunState('idle');
    toast.error("Invoice creation rejected");

    try {
      await rejectInvoiceCreation(
        pendingApproval.runId,
        addMessage
      );
    } catch (error) {
      toast.error("Rejection failed");
    } finally {
      setIsResuming(false);
      setTimeout(() => setButtonsDisabled(false), 2000);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold">Action Pane</h3>
        <p className="text-sm text-muted-foreground">Manual controls and overrides</p>
      </div>

      <ScrollArea className="flex-1 p-4">
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
                disabled={buttonsDisabled || isResuming}
                className="w-full justify-start gap-2"
                variant="default"
              >
                <CheckCircle className="h-4 w-4" />
                Approve and Continue
              </Button>

              <Button
                onClick={handleReject}
                disabled={buttonsDisabled || isResuming}
                className="w-full justify-start gap-2"
                variant="destructive"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileQuestion className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h4 className="font-medium text-sm mb-1">No Pending Actions</h4>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Approval requests will appear here when invoice creation is triggered.
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
