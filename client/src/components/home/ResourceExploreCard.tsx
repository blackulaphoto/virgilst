import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Search, ArrowRight } from "lucide-react";
import { fastPathCategories } from "./categories";

export default function ResourceExploreCard() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/resources");
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-vst-teal/25 bg-gradient-to-br from-vst-bg-elevated to-vst-bg p-6 shadow-[0_0_40px_-15px_rgba(34,231,224,0.35)]">
      <h2 className="text-xl font-bold text-vst-text">Explore resources</h2>
      <p className="mt-1 text-sm text-vst-text-muted">Search programs and services across LA County.</p>

      <form onSubmit={handleSearch} className="mt-4">
        <label htmlFor="hero-resource-search" className="sr-only">
          What do you need?
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vst-text-muted" />
          <input
            id="hero-resource-search"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="What do you need?"
            className="w-full rounded-xl border border-vst-border bg-vst-bg py-2.5 pl-10 pr-3 text-sm text-vst-text placeholder:text-vst-text-muted focus:border-vst-teal focus:outline-none focus:ring-2 focus:ring-vst-teal/40"
          />
        </div>
      </form>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {fastPathCategories.map(category => {
          const Icon = category.icon;
          return (
            <a
              key={category.key}
              href={category.href}
              onClick={e => {
                e.preventDefault();
                navigate(category.href);
              }}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-vst-border bg-vst-bg/60 px-2 py-3 text-center transition-colors hover:border-vst-teal/50 hover:bg-vst-bg-elevated"
            >
              <Icon className="h-5 w-5 text-vst-teal" aria-hidden="true" />
              <span className="text-xs font-medium text-vst-text">{category.title}</span>
            </a>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => navigate("/resources")}
        className="mt-5 inline-flex items-center gap-1 self-start text-sm font-semibold text-vst-teal hover:underline"
      >
        Browse all resources
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
