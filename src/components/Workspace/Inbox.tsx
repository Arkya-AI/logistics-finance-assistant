import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { messagesDAL, filesDAL } from "@/lib/dal";
import { scanGmailInvoices, getGmailConfig } from "@/lib/gmail";
import type { Message, File } from "@/types/database";
import { FileText, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Inbox() {
  const [messages, setMessages] = useState<(Message & { files?: File[] })[]>([]);
  const [loading, setLoading] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const { toast } = useToast();

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
          return { ...msg, files };
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

  function handleOcrExtract(fileId: string, filename: string) {
    toast({
      title: "OCR+Extract",
      description: `Starting extraction for ${filename}`,
    });
    // TODO: Implement actual OCR extraction
  }

  return (
    <div className="flex h-full flex-col p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inbox</h2>
        <div className="flex gap-2">
          {!gmailConnected && (
            <Button variant="outline" size="sm">
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
                      {msg.files?.map((file) => (
                        <Button
                          key={file.id}
                          size="sm"
                          variant="outline"
                          onClick={() => handleOcrExtract(file.id, file.filename)}
                        >
                          OCR+Extract
                        </Button>
                      ))}
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
