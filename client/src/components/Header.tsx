import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Heart,
  MessageSquare,
  Briefcase,
  Stethoscope,
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
  PlusCircle,
  Shield,
  Sparkles,
  LogIn,
  LogOut,
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

const primaryNavItems = [
  { href: "/case-manager", label: "AI Case Manager", icon: Sparkles },
  { href: "/resources", label: "Resources", icon: Heart },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/meetings", label: "Meetings", icon: Users },
  { href: "/get-involved", label: "For Partners", icon: Building2 },
];

const exploreModules = [
  { href: "/chat", label: "Ask Virgil", icon: MessageSquare },
  { href: "/healthcare", label: "Healthcare Hub", icon: Stethoscope },
  { href: "/treatment", label: "Treatment Centers", icon: Building2 },
  { href: "/events", label: "Community Events", icon: CalendarDays },
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
  { href: "/submit-service", label: "Submit a Service", icon: PlusCircle },
];

const navLinkClass =
  "gap-2 text-vst-text-muted hover:bg-vst-bg-elevated hover:text-vst-text data-[active=true]:bg-vst-bg-elevated data-[active=true]:text-vst-teal";

function MobileMenu({ isAdmin }: { isAdmin: boolean }) {
  const [location] = useLocation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-vst-border text-vst-text hover:bg-vst-bg-elevated md:hidden"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] border-vst-border bg-vst-bg text-vst-text sm:w-[380px]">
        <SheetHeader>
          <SheetTitle className="text-vst-text">Explore Virgil</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 overflow-y-auto">
          <div className="space-y-1">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-vst-text-muted">Primary</p>
            {primaryNavItems.map(item => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    data-active={isActive}
                    className={`w-full justify-start ${navLinkClass}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            {isAdmin ? (
              <Link href="/admin">
                <Button variant="ghost" data-active={location === "/admin"} className={`w-full justify-start ${navLinkClass}`}>
                  <Shield className="h-4 w-4" />
                  Admin Mode
                </Button>
              </Link>
            ) : null}
          </div>

          {[
            { title: "Explore", items: exploreModules },
            { title: "Knowledge and Community", items: knowledgeModules },
            { title: "Maps and Tools", items: mapModules },
          ].map(group => (
            <div key={group.title} className="space-y-1">
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-vst-text-muted">{group.title}</p>
              {group.items.map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button variant="ghost" className={`w-full justify-start ${navLinkClass}`}>
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Header() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-50 border-b border-vst-border/60 bg-vst-bg/95 backdrop-blur">
      <div className="container flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
        <Link href="/" className="inline-flex items-center gap-2 text-vst-text">
          <img src="/brand/virgil-logo-on-dark.svg" alt="Virgil St" className="h-8 w-auto sm:h-9" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {primaryNavItems.map(item => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" size="sm" data-active={isActive} className={navLinkClass}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
          {isAdmin ? (
            <Link href="/admin">
              <Button variant="ghost" size="sm" data-active={location === "/admin"} className={navLinkClass}>
                <Shield className="h-4 w-4" />
                Admin Mode
              </Button>
            </Link>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-vst-border text-vst-text hover:bg-vst-bg-elevated hover:text-vst-teal"
              >
                <Grid2x2 className="h-4 w-4" />
                Explore
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Explore</DropdownMenuLabel>
              {exploreModules.map(item => {
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
              {knowledgeModules.map(item => {
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
              {mapModules.map(item => {
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
          <Link href="/search">
            <Button
              variant="ghost"
              size="icon"
              className="hidden text-vst-text-muted hover:bg-vst-bg-elevated hover:text-vst-text sm:inline-flex"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>
          </Link>

          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-vst-text-muted lg:inline">{user?.name || "User"}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="border-vst-border text-vst-text hover:bg-vst-bg-elevated"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden text-vst-text hover:bg-vst-bg-elevated sm:inline-flex"
              >
                <a href={getLoginUrl()}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </a>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-vst-cta-bg text-vst-cta-text hover:opacity-90"
              >
                <a href={getLoginUrl()}>Create account</a>
              </Button>
            </>
          )}

          <MobileMenu isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
