import { ShieldCheck, Sparkles, Lock } from "lucide-react";
import DualPathPanel from "./DualPathPanel";

const trustBullets = [
  { icon: Sparkles, label: "24/7 AI guidance" },
  { icon: ShieldCheck, label: "Verified local resources" },
  { icon: Lock, label: "Private and secure" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-vst-bg py-16 sm:py-20 lg:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #22e7e0 1px, transparent 1px), linear-gradient(to bottom, #22e7e0 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-32 top-0 h-[36rem] w-[36rem] rounded-full bg-vst-teal/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-vst-violet/10 blur-3xl"
        aria-hidden="true"
      />

      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full text-vst-bg-elevated/70"
        viewBox="0 0 1200 160"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {[
          [0, 90, 40, 70],
          [50, 60, 60, 100],
          [120, 100, 36, 60],
          [166, 40, 70, 120],
          [246, 80, 44, 80],
          [300, 20, 76, 140],
          [386, 70, 48, 90],
          [444, 30, 56, 130],
          [510, 96, 40, 64],
          [560, 50, 60, 110],
          [900, 90, 40, 70],
          [950, 60, 60, 100],
          [1020, 100, 36, 60],
          [1066, 40, 70, 120],
          [1146, 80, 44, 80],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={160 - h} width={w} height={h} fill="currentColor" />
        ))}
      </svg>

      <div className="container relative">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-vst-text sm:text-5xl lg:text-6xl">
              Los Angeles.
              <br />
              Real help.
              <br />
              <span className="text-vst-teal">Right now.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-vst-text-muted">
              AI-powered guidance to find housing, food, healthcare, jobs, and more—fast.
            </p>

            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
              {trustBullets.map(bullet => {
                const Icon = bullet.icon;
                return (
                  <li key={bullet.label} className="flex items-center gap-2 text-sm text-vst-text-muted">
                    <Icon className="h-4 w-4 text-vst-teal" aria-hidden="true" />
                    {bullet.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <DualPathPanel />
        </div>
      </div>
    </section>
  );
}
