import ResourceExploreCard from "./ResourceExploreCard";
import CaseManagerCard from "./CaseManagerCard";

export default function DualPathPanel() {
  return (
    <div className="relative grid gap-6 md:grid-cols-2 md:gap-4">
      <ResourceExploreCard />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-vst-border bg-vst-bg text-xs font-bold text-vst-text-muted md:flex"
        aria-hidden="true"
      >
        OR
      </div>

      <CaseManagerCard />
    </div>
  );
}
