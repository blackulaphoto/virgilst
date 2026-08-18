import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";

const pins = [
  { x: 30, y: 35 }, { x: 55, y: 20 }, { x: 70, y: 55 }, { x: 40, y: 70 }, { x: 20, y: 60 }, { x: 62, y: 78 },
];

export default function MapPreviewCard() {
  const [, navigate] = useLocation();

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-vst-border bg-vst-bg-elevated">
      <div className="relative flex-1 min-h-[140px]" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, #1c3a5e 1px, transparent 1px), linear-gradient(to bottom, #1c3a5e 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        {pins.map((pin, i) => (
          <span
            key={i}
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-vst-teal shadow-[0_0_10px_2px_rgba(34,231,224,0.7)]"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          />
        ))}
        <span className="absolute bottom-2 left-2 rounded bg-vst-bg/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-vst-text-muted">
          Downtown Los Angeles
        </span>
      </div>

      <button
        type="button"
        onClick={() => navigate("/resources/map")}
        className="flex items-center justify-center gap-1.5 border-t border-vst-border bg-vst-bg px-4 py-3 text-sm font-semibold text-vst-text transition-colors hover:bg-vst-bg-elevated"
      >
        View on map
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
