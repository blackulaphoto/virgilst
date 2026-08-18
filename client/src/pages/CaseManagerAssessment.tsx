import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Send, ClipboardList } from "lucide-react";
import { getLoginUrl } from "@/const";
import PublicLayout from "@/components/PublicLayout";
import { useLocation } from "wouter";

type LocalMessage = { role: "user" | "assistant"; content: string };

export default function CaseManagerAssessment() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [message, setMessage] = useState("");
  const [assessmentId, setAssessmentId] = useState<number | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMutation = trpc.caseManager.assessment.send.useMutation({
    onSuccess: data => {
      setAssessmentId(data.assessmentId);
      setStatus(data.status);
      setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
    },
  });

  const generatePlanMutation = trpc.caseManager.plan.generate.useMutation({
    onSuccess: () => navigate("/case-manager/dashboard"),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || sendMutation.isPending) return;
    setMessages(prev => [...prev, { role: "user", content: message.trim() }]);
    sendMutation.mutate({ assessmentId, message: message.trim() });
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated) {
    return (
      <PublicLayout title="AI Case Manager" subtitle="A guided assessment that turns into a real plan.">
        <div className="container section-space">
          <Card className="surface-card mx-auto max-w-md p-8 text-center">
            <ClipboardList className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-4 text-2xl font-bold text-card-foreground">Sign In to Get Started</h2>
            <p className="mb-6 text-muted-foreground">
              Create an account so your assessment and plan are saved.
            </p>
            <Button asChild className="w-full bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  const canBuildPlan = status === "actionable" || status === "completed";

  return (
    <PublicLayout
      title="AI Case Manager"
      subtitle="Tell me what's going on. I'll figure out what needs attention and build you a plan."
    >
      <div className="flex min-h-[calc(100vh-11rem)] flex-col">
        <div className="flex-1 overflow-y-auto bg-background">
          <div className="container max-w-4xl py-8">
            {messages.length === 0 ? (
              <div className="text-center">
                <ClipboardList className="mx-auto mb-4 h-16 w-16 text-primary" />
                <h2 className="mb-2 text-2xl font-bold text-foreground">Let's figure out what you need.</h2>
                <p className="text-muted-foreground">
                  Start wherever it's easiest — housing, money, health, anything. You don't need to answer
                  everything before I can start helping.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-4 whitespace-pre-wrap ${
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"
                      }`}
                    >
                      {msg.content}
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

            {canBuildPlan && (
              <Card className="surface-card mt-8 flex flex-col items-center gap-3 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  I have enough to start building your plan — you can keep talking any time to add more.
                </p>
                <Button
                  onClick={() => assessmentId && generatePlanMutation.mutate({ assessmentId })}
                  disabled={generatePlanMutation.isPending}
                  className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95"
                >
                  {generatePlanMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Build my care plan
                </Button>
              </Card>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-card/80">
          <div className="container max-w-4xl py-4">
            {sendMutation.isError && (
              <p className="mb-2 text-sm text-destructive">
                {sendMutation.error?.message || "Something went wrong sending that. Try again."}
              </p>
            )}
            {generatePlanMutation.isError && (
              <p className="mb-2 text-sm text-destructive">
                {generatePlanMutation.error?.message || "Couldn't build the plan. Try again."}
              </p>
            )}
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's going on?"
                className="min-h-[60px] resize-none"
                disabled={sendMutation.isPending}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
                size="icon"
                className="h-[60px] w-[60px] shrink-0"
              >
                {sendMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
