import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { messagesDAL, filesDAL, invoicesDAL } from "@/lib/dal";
import { scanGmailInvoices, getGmailConfig, initiateGmailOAuth } from "@/lib/gmail";
import { processInvoice } from "@/lib/orchestrator";
import type { Message, File, Invoice } from "@/types/database";
import { FileText, RefreshCw, Download, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useChatStore } from "@/store/chatStore";
import { supabase } from "@/integrations/supabase/client";

export function Inbox() {
  const [messages, setMessages] = useState<(Message & { files?: (File & { invoice?: Invoice })[] })[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [gmailConnected, setGmailConnected] = useState(false);
  const { toast } = useToast();
  const { autoProcess } = useChatStore();

  useEffect(() => {
    loadMessages();
    checkGmailConnection();
  }, []);

  async function checkGmailConnection() {
    try {
      const config = await getGmailConfig();
      setGmailConnected(!!config);
    } catch (error) {
      console.error("Error checking Gmail connection:", error);
    }
  }

  async function loadMessages() {
    try {
      setLoading(true);
      const msgs = await messagesDAL.getAll();
      
      // Load files for each message
      const msgsWithFiles = await Promise.all(
        msgs.map(async (msg) => {
          const files = await filesDAL.getByMessageId(msg.id);
          
          // Load invoice data for each file
          const filesWithInvoice = await Promise.all(
            files.map(async (file) => {
              const invoices = await invoicesDAL.getAll();
              const invoice = invoices.find(inv => inv.file_id === file.id);
              return { ...file, invoice };
            })
          );

          return { ...msg, files: filesWithInvoice };
        })
      );

      setMessages(msgsWithFiles);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectGmail() {
    try {
      const { authUrl } = await initiateGmailOAuth();
      window.open(authUrl, "_blank");
      toast({
        title: "Gmail OAuth",
        description: "Please complete authentication in the new window",
      });
    } catch (error) {
      console.error("Error initiating Gmail OAuth:", error);
      toast({
        title: "Error",
        description: "Failed to initiate Gmail connection",
        variant: "destructive",
      });
    }
  }

  async function handleScan() {
    try {
      setLoading(true);
      const result = await scanGmailInvoices(14);
      toast({
        title: "Scan Complete",
        description: `Found ${result.messagesFound} messages`,
      });
      await loadMessages();
    } catch (error) {
      console.error("Error scanning Gmail:", error);
      toast({
        title: "Error",
        description: "Failed to scan Gmail",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleProcess(fileId: string, filename: string) {
    setProcessing(prev => new Set(prev).add(fileId));
    toast({
      title: "Processing Invoice",
      description: `Starting processing for ${filename}`,
    });

    try {
      await processInvoice(fileId);
      toast({
        title: "Success",
        description: `Invoice processed successfully`,
      });
      await loadMessages();
    } catch (error) {
      console.error("Error processing invoice:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Processing failed",
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
  }

  async function downloadExport(fileId: string, type: "csv" | "json", filename: string) {
    try {
      const path = `${fileId}/invoice.${type}`;
      const { data, error } = await supabase.storage
        .from("exports")
        .download(path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename.replace(/\.[^/.]+$/, "")}_invoice.${type}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Downloading ${type.toUpperCase()} export`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: `Failed to download ${type.toUpperCase()}`,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex h-full flex-col p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inbox</h2>
        <div className="flex gap-2">
          {!gmailConnected && (
            <Button variant="outline" size="sm" onClick={handleConnectGmail}>
              Connect Gmail
            </Button>
          )}
          <Button
            onClick={handleScan}
            disabled={loading || !gmailConnected}
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Scan Gmail
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Attachments</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {loading ? "Loading..." : "No messages found. Click 'Scan Gmail' to fetch invoices."}
                </TableCell>
              </TableRow>
            ) : (
              messages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="font-medium">{msg.from}</TableCell>
                  <TableCell>{msg.subject}</TableCell>
                  <TableCell>
                    {new Date(msg.received_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {msg.files?.map((file) => (
                        <div key={file.id} className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4" />
                          {file.filename}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {msg.files?.map((file) => {
                        const isProcessing = processing.has(file.id);
                        const hasInvoice = !!file.invoice;

                        return (
                          <div key={file.id} className="flex items-center gap-2">
                            {!hasInvoice && !autoProcess && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProcess(file.id, file.filename)}
                                disabled={isProcessing}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                {isProcessing ? "Processing..." : "Process"}
                              </Button>
                            )}
                            {hasInvoice && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => downloadExport(file.id, "csv", file.filename)}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  CSV
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => downloadExport(file.id, "json", file.filename)}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  JSON
                                </Button>
                              </>
                            )}
                            {autoProcess && !hasInvoice && isProcessing && (
                              <span className="text-sm text-muted-foreground">Processing...</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
