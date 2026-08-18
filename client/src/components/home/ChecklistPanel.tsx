import { Check } from "lucide-react";

const steps = [
  { title: "Complete profile", meta: "2 min", description: "Tell us a bit about your situation.", state: "done" as const },
  { title: "Verify eligibility", meta: "5 min", description: "Answer a few questions to find programs you qualify for.", state: "upcoming" as const },
  { title: "Get matched", meta: "Instant", description: "We'll show the best options and what to do next.", state: "upcoming" as const },
  { title: "Take action", meta: "Ongoing", description: "Apply, connect, and check your status.", state: "upcoming" as const },
];

export default function ChecklistPanel() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-vst-text">Today's next steps</h2>
      <p className="mt-1 text-sm text-vst-text-muted">A personalized plan, updated as you go.</p>

      <ol className="mt-6 space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className={`flex items-start gap-3 rounded-xl border p-3 ${
              step.state === "done" ? "border-vst-teal/40 bg-vst-teal/5" : "border-vst-border bg-vst-bg/60"
            }`}
          >
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                step.state === "done" ? "bg-vst-teal text-vst-cta-text" : "border border-vst-border text-vst-text-muted"
              }`}
            >
              {step.state === "done" ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-vst-text">{step.title}</p>
                <span className="shrink-0 text-xs text-vst-text-muted">{step.meta}</span>
              </div>
              <p className="mt-0.5 text-xs text-vst-text-muted">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
