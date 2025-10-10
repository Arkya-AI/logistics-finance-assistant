import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfidenceBadge } from "@/components/Badge";
import { useChatStore } from "@/store/chatStore";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function Exceptions() {
  const { exceptions, removeException, currentDoc } = useChatStore();

  const handleAccept = (id: string) => {
    removeException(id);
    toast.success("Exception accepted and resolved");
  };

  // Mock low-confidence fields from current doc
  const lowConfidenceFields = currentDoc?.parsedFields.filter((f) => f.confidence < 0.5) || [];

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
          {lowConfidenceFields.length === 0 && exceptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No exceptions to review
            </p>
          ) : (
            <>
              {lowConfidenceFields.map((field) => (
                <div
                  key={field.key}
                  className="rounded-lg border border-status-warning bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-status-warning flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{field.key}</span>
                        <ConfidenceBadge confidence={field.confidence} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Value: <span className="font-mono">{field.value}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This field has low confidence and may need manual review.
                      </p>
                      <Button
                        onClick={() => toast.success("Field marked as reviewed")}
                        size="sm"
                        className="w-full mt-2"
                      >
                        Accept and Continue
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {exceptions.map((exception) => (
                <div
                  key={exception.id}
                  className="rounded-lg border border-status-warning bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-status-warning flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{exception.field.key}</span>
                        <ConfidenceBadge confidence={exception.field.confidence} />
                      </div>
                      <p className="text-sm text-muted-foreground">{exception.reason}</p>
                      <Button
                        onClick={() => handleAccept(exception.id)}
                        size="sm"
                        className="w-full mt-2"
                      >
                        Accept and Continue
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
