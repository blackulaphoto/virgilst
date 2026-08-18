import { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export interface PublicLayoutProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function PublicLayout({ title, subtitle, actions, children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {(title || subtitle) && (
        <section className="section-space border-b border-border/70 bg-gradient-to-b from-card to-background">
          <div className="container fade-rise flex flex-wrap items-start justify-between gap-4">
            <div>
              {title && <h1 className="text-foreground">{title}</h1>}
              {subtitle && <p className="mt-3 max-w-3xl text-base text-muted-foreground">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </section>
      )}

      <main>{children}</main>

      <Footer />
    </div>
  );
}
