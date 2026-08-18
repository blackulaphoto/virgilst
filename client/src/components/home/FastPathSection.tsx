import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { fastPathCategories } from "./categories";
import CategoryCard from "./CategoryCard";

export default function FastPathSection() {
  const [, navigate] = useLocation();

  return (
    <section className="border-b border-border bg-background py-16">
      <div className="container">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Fast paths to what you need</h2>
          <button
            type="button"
            onClick={() => navigate("/resources")}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            All categories
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {fastPathCategories.map(category => (
            <CategoryCard key={category.key} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
