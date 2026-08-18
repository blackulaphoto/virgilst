import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import type { FastPathCategory } from "./categories";

export default function CategoryCard({ category }: { category: FastPathCategory }) {
  const [, navigate] = useLocation();
  const Icon = category.icon;

  return (
    <a
      href={category.href}
      onClick={e => {
        e.preventDefault();
        navigate(category.href);
      }}
      className="surface-card group flex flex-col gap-3 p-5"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold text-foreground">{category.title}</h3>
      <p className="text-sm text-muted-foreground">{category.description}</p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
        View programs
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </a>
  );
}
