import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/store/chatStore";
import { Clock } from "lucide-react";

export function Timeline() {
  const { timeline } = useChatStore();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold">Timeline</h3>
        <p className="text-sm text-muted-foreground">Chronological execution history</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No timeline entries yet
          </p>
        ) : (
          <div className="relative space-y-4 before:absolute before:left-4 before:top-0 before:h-full before:w-px before:bg-border">
            {timeline.map((entry) => (
              <div key={entry.id} className="relative pl-10">
                <div className="absolute left-0 top-1.5 h-8 w-8 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      {entry.toolName && (
                        <span className="text-xs font-medium text-primary">
                          {entry.toolName}
                        </span>
                      )}
                      <p className="text-sm mt-1">{entry.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(entry.ts).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
