import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send, Minimize2, Maximize2, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function FloatingAIAssistant() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.chat.send.useMutation({
    onSuccess: (data: any) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get context-aware greeting based on current page
  const getContextualGreeting = () => {
    if (location.includes("/calendar")) {
      return "Hi! I can help you understand court dates, deadlines, and what to prepare for each event. What would you like to know?";
    } else if (location.includes("/cases") || location.includes("/legal")) {
      return "Hi! I'm here to guide you through your legal case. I can explain forms, suggest next steps, and answer questions about custody reunification or record expungement.";
    } else if (location.includes("/forum")) {
      return "Hi! I can help you find information, connect with resources, or answer questions about navigating social services.";
    } else if (location.includes("/resources")) {
      return "Hi! I can help you find shelters, food banks, medical clinics, and other essential resources near you.";
    } else {
      return "Hi! I'm Virgil, your AI assistant. I can help you navigate social services, understand legal processes, find resources, and answer questions. How can I help you today?";
    }
  };

  // Initialize conversation when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: getContextualGreeting(),
        },
      ]);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !isAuthenticated) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    // Add context about current page
    const contextMessage = `[User is currently on: ${location}]\n\n${userMessage}`;

    // Send to backend
    chatMutation.mutate({
      message: contextMessage,
      conversationId: conversationId || undefined,
    });

    // Store conversation ID if this is the first message
    if (!conversationId && chatMutation.data?.conversationId) {
      setConversationId(chatMutation.data.conversationId);
    }
  };

  const handleQuickAction = (action: string) => {
    let message = "";
    if (action === "explain_form") {
      message = "Can you explain what forms I need and what they mean in simple terms?";
    } else if (action === "next_steps") {
      message = "What should I do next in my case?";
    } else if (action === "common_questions") {
      message = "What are the most common questions people ask about this process?";
    }
    setInput(message);
  };

  if (!isAuthenticated) {
    return null; // Don't show assistant if not logged in
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card
          className={`fixed bottom-6 right-6 shadow-2xl z-50 transition-all ${
            isMinimized ? "h-16 w-80" : "h-[600px] w-96"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Virgil AI Assistant</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8"
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              <CardContent className="p-0 flex flex-col h-[calc(600px-140px)]">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <Streamdown>{msg.content}</Streamdown>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">Thinking...</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                {messages.length <= 1 && (
                  <div className="px-4 pb-2 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction("explain_form")}
                      className="text-xs"
                    >
                      Explain Forms
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction("next_steps")}
                      className="text-xs"
                    >
                      What's Next?
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction("common_questions")}
                      className="text-xs"
                    >
                      Common Questions
                    </Button>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Ask me anything..."
                      className="min-h-[60px] resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || chatMutation.isPending}
                      size="icon"
                      className="h-[60px] w-[60px]"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      )}
    </>
  );
}
