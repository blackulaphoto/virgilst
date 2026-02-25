import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { skipToken } from "@tanstack/react-query";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { Streamdown } from "streamdown";
import { getLoginUrl } from "@/const";
import PublicLayout from "@/components/PublicLayout";

const SUGGESTED_PROMPTS = [
  "How do I apply for General Relief (GR)?",
  "Where can I sleep tonight?",
  "How do I get my Medi-Cal card?",
  "What is Section 8 housing?",
  "How do I avoid a shelter sweep?",
  "I need help with CPS",
];

export default function Chat() {
  const { isAuthenticated, user } = useAuth();
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<number | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: conversations } = trpc.chat.conversations.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: messages } = trpc.chat.messages.useQuery(
    conversationId ? { conversationId } : skipToken
  );

  const sendMutation = trpc.chat.send.useMutation({
    onSuccess: async (data) => {
      setConversationId(data.conversationId);
      setMessage("");
      await utils.chat.messages.invalidate({ conversationId: data.conversationId });
      await utils.chat.conversations.invalidate();
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || sendMutation.isPending) return;

    sendMutation.mutate({
      conversationId,
      message: message.trim(),
    });
  };

  const handlePromptClick = (prompt: string) => {
    setMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated) {
    return (
      <PublicLayout title="Ask Virgil" subtitle="Direct guidance for social services, legal navigation, and recovery support.">
        <div className="container section-space">
          <Card className="surface-card mx-auto max-w-md p-8 text-center">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-4 text-2xl font-bold text-card-foreground">
              Sign In to Talk to Virgil
            </h2>
            <p className="mb-6 text-muted-foreground">
              Create an account to save your conversations and get personalized help.
            </p>
            <Button asChild className="w-full bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout title="Ask Virgil" subtitle="Your case manager for housing, benefits, healthcare, legal support, and practical next steps.">
      <div className="flex min-h-[calc(100vh-11rem)] flex-col">
        <div className="flex-1 overflow-y-auto bg-background">
        <div className="container max-w-4xl py-8">
          {!messages || messages.length === 0 ? (
            <div className="space-y-8">
              <div className="text-center">
                <MessageSquare className="mx-auto mb-4 h-16 w-16 text-primary" />
                <h2 className="mb-2 text-2xl font-bold text-foreground">
                  Hey {user?.name || "there"}, I'm Virgil
                </h2>
                <p className="text-muted-foreground">
                  I'm here to help you navigate social services, housing, benefits, and more.
                  Ask me anything.
                </p>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Try asking:
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      className="h-auto justify-start whitespace-normal p-4 text-left"
                      onClick={() => handlePromptClick(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-card-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Streamdown>{msg.content}</Streamdown>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {sendMutation.isPending && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg bg-card p-4 text-card-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/80">
        <div className="container max-w-4xl py-4">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Virgil anything..."
              className="min-h-[60px] resize-none"
              disabled={sendMutation.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMutation.isPending}
              size="icon"
              className="h-[60px] w-[60px] shrink-0"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
      </div>
    </PublicLayout>
  );
}
