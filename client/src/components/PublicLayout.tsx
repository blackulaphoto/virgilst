import { ReactNode } from "react";
import { Link } from "wouter";
import { Heart, MessageSquare, Briefcase, Stethoscope, Home as HomeIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PublicLayoutProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/resources", label: "Resources", icon: Heart },
  { href: "/chat", label: "Ask Virgil", icon: MessageSquare },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/meetings", label: "Meetings", icon: Users },
  { href: "/medical-providers", label: "Healthcare", icon: Stethoscope },
];

export default function PublicLayout({ title, subtitle, actions, children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="container flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
          <Link href="/">
            <a className="inline-flex items-center gap-2 text-foreground">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-base font-semibold">Virgil St</span>
            </a>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      </header>

      {(title || subtitle) && (
        <section className="section-space border-b border-border/70 bg-gradient-to-b from-card to-background">
          <div className="container fade-rise">
            {title && <h1 className="text-foreground">{title}</h1>}
            {subtitle && <p className="mt-3 max-w-3xl text-base text-muted-foreground">{subtitle}</p>}
          </div>
        </section>
      )}

      <main>{children}</main>
    </div>
  );
}
