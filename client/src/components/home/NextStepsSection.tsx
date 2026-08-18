import { useLocation } from "wouter";
import ChecklistPanel from "./ChecklistPanel";
import RecommendedProgramCard from "./RecommendedProgramCard";
import MapPreviewCard from "./MapPreviewCard";

export default function NextStepsSection() {
  const [, navigate] = useLocation();

  return (
    <section className="bg-background py-16">
      <div className="container">
        <article className="overflow-hidden rounded-3xl border border-vst-border bg-vst-bg p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr_0.8fr]">
            <ChecklistPanel />
            <RecommendedProgramCard />
            <MapPreviewCard />
          </div>

          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-vst-border bg-vst-bg-elevated p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-vst-text">Next step: Complete eligibility questions</p>
              <p className="text-xs text-vst-text-muted">Takes about 5 minutes</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/case-manager/assessment")}
              className="w-full rounded-xl bg-vst-cta-bg px-5 py-2.5 text-sm font-semibold text-vst-cta-text transition-opacity hover:opacity-90 sm:w-auto"
            >
              Continue
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
