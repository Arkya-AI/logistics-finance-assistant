import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ConfidenceBadge } from "@/components/Badge";
import { useChatStore } from "@/store/chatStore";
import { File } from "lucide-react";

export function DocViewer() {
  const { currentDoc, updateDocField } = useChatStore();

  if (!currentDoc) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No document loaded</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold">Document Viewer</h3>
        <p className="text-sm text-muted-foreground">Review and edit parsed fields</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Email Preview */}
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium mb-2">Email Preview</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {currentDoc.emailPreviewText}
            </p>
          </div>

          {/* Attachment */}
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium mb-2">Attachment</h4>
            <div className="flex items-center gap-2 text-sm">
              <File className="h-4 w-4 text-primary" />
              <span>{currentDoc.attachmentName}</span>
            </div>
          </div>

          {/* Parsed Fields */}
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium mb-3">Parsed Fields</h4>
            <div className="space-y-4">
              {currentDoc.parsedFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{field.key}</label>
                    <ConfidenceBadge confidence={field.confidence} />
                  </div>
                  <Input
                    value={field.value}
                    onChange={(e) => updateDocField(field.key, e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Fields are editable. Changes update the current document state.
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
