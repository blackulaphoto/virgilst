import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Heart,
  MessageSquare,
  Briefcase,
  Stethoscope,
  Home as HomeIcon,
  Users,
  Menu,
  Grid2x2,
  Map as MapIcon,
  Search,
  Newspaper,
  Video,
  Building2,
  CalendarDays,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export interface PublicLayoutProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

const primaryNavItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/chat", label: "Ask Virgil", icon: MessageSquare },
  { href: "/resources", label: "Resources", icon: Heart },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/meetings", label: "Meetings", icon: Users },
  { href: "/medical-providers", label: "Healthcare", icon: Stethoscope },
];

const supportModules = [
  { href: "/treatment", label: "Treatment Centers", icon: Building2 },
  { href: "/events", label: "Community Events", icon: CalendarDays },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/meetings", label: "Recovery Meetings", icon: Users },
  { href: "/medical-providers", label: "Medi-Cal Providers", icon: Stethoscope },
];

const knowledgeModules = [
  { href: "/articles", label: "Resource Library", icon: Newspaper },
  { href: "/forum", label: "Community Forum", icon: MessageSquare },
  { href: "/videos", label: "Video Library", icon: Video },
  { href: "/search", label: "Search Everything", icon: Search },
];

const mapModules = [
  { href: "/map", label: "Community Map", icon: MapIcon },
  { href: "/resources/map", label: "Resource Map", icon: MapIcon },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

function MobileMenu() {
  const [location] = useLocation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] sm:w-[380px]">
        <SheetHeader>
          <SheetTitle>Explore Virgil</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-1">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Primary</p>
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Support Services</p>
            {supportModules.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Knowledge and Community</p>
            {knowledgeModules.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maps and Tools</p>
            {mapModules.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function PublicLayout({ title, subtitle, actions, children }: PublicLayoutProps) {
  const [location, navigate] = useLocation();

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
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Grid2x2 className="h-4 w-4" />
                  Explore
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Support Services</DropdownMenuLabel>
                {supportModules.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} className="gap-2" onSelect={() => navigate(item.href)}>
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  );
                })}

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Knowledge and Community</DropdownMenuLabel>
                {knowledgeModules.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} className="gap-2" onSelect={() => navigate(item.href)}>
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  );
                })}

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Maps and Tools</DropdownMenuLabel>
                {mapModules.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} className="gap-2" onSelect={() => navigate(item.href)}>
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="flex items-center gap-2">
            {actions}
            <MobileMenu />
          </div>
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
