import { LucideIcon } from "lucide-react";

export interface StatPillProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
}

export default function StatPill({ label, value, icon: Icon }: StatPillProps) {
  return (
    <div className="surface-card flex items-center gap-3 px-4 py-3">
      {Icon && (
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
