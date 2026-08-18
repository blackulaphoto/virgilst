import { useLocation } from "wouter";
import { HandCoins, MapPin, CheckCircle2, ExternalLink } from "lucide-react";

const tags = [
  { icon: HandCoins, label: "Rent assistance" },
  { icon: MapPin, label: "LA County" },
  { icon: CheckCircle2, label: "Accepting applications" },
];

const stats = [
  { value: "$1,500", label: "Monthly assistance" },
  { value: "3–12 mo", label: "Duration" },
  { value: "Online", label: "Apply" },
];

export default function RecommendedProgramCard() {
  const [, navigate] = useLocation();

  return (
    <div className="flex h-full flex-col rounded-2xl border border-vst-border bg-vst-bg-elevated p-6">
      <span className="text-xs font-semibold uppercase tracking-wide text-vst-teal">Recommended for you</span>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-bold text-vst-text">LAHSA Interim Housing Program</h3>
        <span className="rounded-full bg-vst-teal/15 px-2 py-0.5 text-xs font-semibold text-vst-teal">Match 93%</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {tags.map(tag => {
          const Icon = tag.icon;
          return (
            <span key={tag.label} className="flex items-center gap-1.5 text-xs text-vst-text-muted">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {tag.label}
            </span>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-vst-text-muted">
        Short-term rental assistance for households at risk of homelessness.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 border-y border-vst-border py-3">
        {stats.map(stat => (
          <div key={stat.label}>
            <p className="text-sm font-bold text-vst-text">{stat.value}</p>
            <p className="text-xs text-vst-text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => navigate("/resources/housing")}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-vst-coral px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        View & apply
        <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  );
}
