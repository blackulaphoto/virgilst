import { useEffect, useMemo, useRef, useState } from "react";
import { LucideIcon } from "lucide-react";

export interface StatPillProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
}

function extractNumericParts(value: number | string) {
  if (typeof value === "number") {
    return { number: value, prefix: "", suffix: "" };
  }

  const match = value.match(/(\d[\d,]*)/);
  if (!match) return null;

  const digits = parseInt(match[1].replace(/,/g, ""), 10);
  if (Number.isNaN(digits)) return null;

  const start = value.indexOf(match[1]);
  const end = start + match[1].length;

  return {
    number: digits,
    prefix: value.slice(0, start),
    suffix: value.slice(end),
  };
}

export default function StatPill({ label, value, icon: Icon }: StatPillProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState<number | string>(
    typeof value === "number" ? value : value
  );

  const parsed = useMemo(() => extractNumericParts(value), [value]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !parsed) {
      setDisplay(value);
      return;
    }

    const duration = 1100;
    const start = performance.now();
    let raf = 0;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(parsed.number * eased);

      const text = `${parsed.prefix}${nextValue.toLocaleString()}${parsed.suffix}`;
      setDisplay(text);

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [visible, parsed, value]);

  return (
    <div ref={ref} className="surface-card flex items-center gap-3 px-4 py-3">
      {Icon && (
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div>
        <p className="text-xl font-bold text-foreground">{display}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
