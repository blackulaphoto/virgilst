import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, CalendarDays, Stethoscope, Briefcase } from "lucide-react";

export default function StatsStrip() {
  const { data } = trpc.system.publicStats.useQuery();

  const stats = useMemo(
    () => [
      { label: "Verified resources", value: data?.resourcesCount, icon: ShieldCheck },
      { label: "Recovery meetings", value: data?.meetingsCount, icon: CalendarDays },
      { label: "Medi-Cal providers", value: data?.mediCalProvidersCount, icon: Stethoscope },
      { label: "Open job listings", value: data?.jobsCount, icon: Briefcase },
    ],
    [data]
  );

  return (
    <section className="border-b border-border bg-background py-10">
      <div className="container grid grid-cols-2 gap-6 sm:grid-cols-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xl font-bold text-foreground">
                  {stat.value !== undefined ? stat.value.toLocaleString() : "…"}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
