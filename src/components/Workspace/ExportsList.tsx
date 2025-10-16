import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { exportsDAL } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ExportsListProps {
  invoiceId: string;
}

export function ExportsList({ invoiceId }: ExportsListProps) {
  const queryClient = useQueryClient();
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const { data: exports, isLoading } = useQuery({
    queryKey: ["exports", invoiceId],
    queryFn: () => exportsDAL.getByInvoiceId(invoiceId),
  });

  const regenerateMutation = useMutation({
    mutationFn: (exportId: string) => exportsDAL.regenerateSignedUrl(exportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exports", invoiceId] });
      toast.success("Download link regenerated successfully");
      setRegeneratingId(null);
    },
    onError: (error) => {
      toast.error("Failed to regenerate link: " + error.message);
      setRegeneratingId(null);
    },
  });

  const handleRegenerate = (exportId: string) => {
    setRegeneratingId(exportId);
    regenerateMutation.mutate(exportId);
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return true;
    return new Date(expiresAt) < new Date();
  };

  const getFileType = (filePath: string) => {
    if (filePath.endsWith(".csv")) return "CSV";
    if (filePath.endsWith(".json")) return "JSON";
    return "File";
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading exports...</div>;
  }

  if (!exports || exports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Exports
          </CardTitle>
          <CardDescription>No exports available for this invoice</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="h-5 w-5" />
          Exports
        </CardTitle>
        <CardDescription>
          Secure download links (valid for 24 hours)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {exports.map((exp) => {
          const expired = isExpired(exp.expires_at);
          const fileType = getFileType(exp.file_path);
          
          return (
            <div
              key={exp.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{fileType} Export</span>
                  {expired && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                      Expired
                    </span>
                  )}
                </div>
                {exp.expires_at && !expired && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Expires {formatDistanceToNow(new Date(exp.expires_at), { addSuffix: true })}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {!expired && exp.signed_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a
                      href={exp.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Download
                    </a>
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant={expired ? "default" : "ghost"}
                  onClick={() => handleRegenerate(exp.id)}
                  disabled={regeneratingId === exp.id}
                >
                  <RefreshCw className={`h-4 w-4 ${regeneratingId === exp.id ? "animate-spin" : ""}`} />
                  {expired ? "Generate Link" : "Regenerate"}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
