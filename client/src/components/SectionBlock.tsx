import { ReactNode } from "react";

interface SectionBlockProps {
  title?: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}

export default function SectionBlock({ title, subtitle, className = "", children }: SectionBlockProps) {
  return (
    <section className={`section-space ${className}`}>
      <div className="container">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && <h2 className="text-foreground">{title}</h2>}
            {subtitle && <p className="mt-3 max-w-3xl text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
