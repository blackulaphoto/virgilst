import { useLocation } from "wouter";
import { Sparkles, ArrowRight } from "lucide-react";

export default function CaseManagerCard() {
  const [, navigate] = useLocation();

  return (
    <div className="flex h-full flex-col rounded-2xl border border-vst-violet/30 bg-gradient-to-br from-vst-bg-elevated to-vst-bg p-6 shadow-[0_0_40px_-15px_rgba(124,92,252,0.4)]">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-vst-violet" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wide text-vst-violet">AI Case Manager</span>
      </div>
      <h2 className="mt-1 text-xl font-bold text-vst-text">Work with an AI Case Manager</h2>
      <p className="mt-1 text-sm text-vst-text-muted">Get a personalized plan, step-by-step. 24/7. Free.</p>

      <div className="mt-4 flex-1 space-y-2.5 rounded-xl border border-vst-border bg-vst-bg/60 p-4" aria-hidden="true">
        <div className="flex items-start gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-vst-violet/20 text-vst-violet">
            <Sparkles className="h-3 w-3" />
          </span>
          <p className="rounded-lg rounded-tl-none bg-vst-bg-elevated px-3 py-1.5 text-xs text-vst-text-muted">
            Hi, I'm Virgil. How can I help you today?
          </p>
        </div>
        <div className="flex justify-end">
          <p className="rounded-lg rounded-tr-none bg-vst-teal/90 px-3 py-1.5 text-xs font-medium text-vst-cta-text">
            I need help paying rent
          </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-vst-violet/20 text-vst-violet">
            <Sparkles className="h-3 w-3" />
          </span>
          <p className="rounded-lg rounded-tl-none bg-vst-bg-elevated px-3 py-1.5 text-xs text-vst-text-muted">
            I found 6 rent assistance programs you may qualify for. Want me to help you apply?
          </p>
        </div>
        <div className="flex items-center gap-1 pl-8">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-vst-text-muted" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-vst-text-muted [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-vst-text-muted [animation-delay:300ms]" />
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate("/case-manager/assessment")}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-vst-cta-bg px-4 py-2.5 text-sm font-semibold text-vst-cta-text transition-opacity hover:opacity-90"
      >
        Start a conversation
        <ArrowRight className="h-4 w-4" />
      </button>
      <p className="mt-2 text-center text-xs text-vst-text-muted">Powered by trusted human services data</p>
    </div>
  );
}
