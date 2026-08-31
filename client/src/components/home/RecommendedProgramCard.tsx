import { useLocation } from "wouter";
import { ArrowRight, Home, MapPin } from "lucide-react";

export default function RecommendedProgramCard() {
  const [, navigate] = useLocation();

  return (
    <div className="flex h-full flex-col rounded-2xl border border-vst-border bg-vst-bg-elevated p-6">
      <span className="text-xs font-semibold uppercase tracking-wide text-vst-teal">Housing resources</span>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Home className="h-5 w-5 text-vst-teal" aria-hidden="true" />
        <h3 className="text-lg font-bold text-vst-text">Find housing options</h3>
      </div>

      <p className="mt-3 text-sm text-vst-text-muted">
        Explore shelters, interim housing, rental assistance, and other housing resources. Availability and eligibility vary by provider.
      </p>

      <div className="mt-4 flex items-start gap-2 border-y border-vst-border py-3 text-sm text-vst-text-muted">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-vst-teal" aria-hidden="true" />
        <span>Start with Los Angeles-area options, then browse statewide resources where relevant.</span>
      </div>

      <button
        type="button"
        onClick={() => navigate("/resources/housing")}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-vst-coral px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Explore housing resources
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
