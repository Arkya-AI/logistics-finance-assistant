import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { handleUserMessage } from "@/lib/agentHandler";
import { ChatMessage as ChatMessageType } from "@/types";

export function ChatPanel() {
  const [input, setInput] = useState("");
  const { messages, addMessage, addException, pauseRun, setPendingApproval } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessageType = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: input,
      ts: Date.now(),
    };

    addMessage(userMessage);
    setInput("");

    // Handle the message with the agent
    await handleUserMessage(input, addMessage, addException, pauseRun, setPendingApproval);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col border-r">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Finance Agent</h2>
        <p className="text-sm text-muted-foreground">
          Ask me to summarize, create invoices, send reminders, or process documents
        </p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <p className="mt-1 text-xs opacity-70">
                  {new Date(msg.ts).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
