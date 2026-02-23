import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import PublicLayout from "@/components/PublicLayout";
import SectionBlock from "@/components/SectionBlock";
import ActionPathCard from "@/components/ActionPathCard";
import StatPill from "@/components/StatPill";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import {
  ArrowRight,
  Home as HomeIcon,
  UtensilsCrossed,
  Briefcase,
  Stethoscope,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  CalendarDays,
  LogIn,
  LogOut,
  User,
  MapPin,
  Grid2x2,
  HeartHandshake,
  HandHeart,
  Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();

  const { data: statsData } = trpc.system.publicStats.useQuery();

  const stats = useMemo(
    () => [
      { label: "Verified resources", value: statsData?.resourcesCount ?? "...", icon: ShieldCheck },
      { label: "Recovery meetings", value: statsData?.meetingsCount ?? "...", icon: CalendarDays },
      { label: "Medi-Cal providers", value: statsData?.mediCalProvidersCount ?? "3,326+", icon: Stethoscope },
      { label: "Open job listings", value: statsData?.jobsCount ?? "...", icon: Briefcase },
    ],
    [statsData]
  );

  const authActions = isAuthenticated ? (
    <>
      <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
        <User className="h-4 w-4" />
        <span>{user?.name || "User"}</span>
      </div>
      <Button variant="outline" size="sm" onClick={() => logout()}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    </>
  ) : (
    <Button size="sm" onClick={() => (window.location.href = getLoginUrl())}>
      <LogIn className="mr-2 h-4 w-4" />
      Sign in
    </Button>
  );

  return (
    <PublicLayout
      actions={authActions}
      title="Help, without the runaround."
      subtitle="Find housing, food, healthcare, legal guidance, and work opportunities across Los Angeles County in minutes."
    >
      <SectionBlock className="hero-atmosphere pt-10 md:pt-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="fade-rise">
            <p className="mb-5 max-w-2xl text-lg text-muted-foreground">
              Virgil is public infrastructure redesigned for dignity. Ask one question and get verified options you can act on today.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/chat">
                <Button size="lg" className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">
                  Get Help Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/resources">
                <Button size="lg" variant="outline">
                  Explore Resources
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Serving Los Angeles County</span>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-gradient-to-br from-secondary/70 to-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">What Virgil helps with</p>
            <ul className="mt-4 space-y-3">
              {[
                "Housing placement and shelter access",
                "Food resources and meal programs",
                "Medi-Cal and healthcare navigation",
                "Recovery meetings and treatment support",
                "Job search and next-step planning",
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pointer-events-none absolute right-6 top-6 hidden h-36 w-64 opacity-[0.04] lg:block">
          <svg viewBox="0 0 320 160" className="h-full w-full fill-primary">
            <rect x="14" y="88" width="18" height="52" rx="2" />
            <rect x="40" y="70" width="24" height="70" rx="2" />
            <rect x="70" y="94" width="16" height="46" rx="2" />
            <rect x="93" y="60" width="26" height="80" rx="2" />
            <rect x="127" y="78" width="20" height="62" rx="2" />
            <rect x="154" y="46" width="28" height="94" rx="2" />
            <rect x="189" y="82" width="20" height="58" rx="2" />
            <rect x="216" y="64" width="24" height="76" rx="2" />
            <rect x="247" y="90" width="16" height="50" rx="2" />
            <rect x="269" y="74" width="24" height="66" rx="2" />
            <rect x="300" y="84" width="12" height="56" rx="2" />
            <path d="M0 140 H320" stroke="currentColor" strokeWidth="3" fill="none" />
          </svg>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Choose your next step"
        subtitle="Start with the need you have right now. Each path takes you directly to verified programs and actionable options."
        className="rounded-t-[40px] border-t border-primary/10 bg-card/60"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ActionPathCard
            title="I need housing"
            description="Shelter tonight, housing applications, and stability pathways."
            icon={HomeIcon}
            href="/resources/housing"
            tone="teal"
          />
          <ActionPathCard
            title="I need food"
            description="Pantries, meal sites, and immediate nourishment options."
            icon={UtensilsCrossed}
            href="/resources/food"
            tone="sky"
          />
          <ActionPathCard
            title="I need work"
            description="Hiring-now listings and practical job opportunities."
            icon={Briefcase}
            href="/jobs"
            tone="coral"
          />
          <ActionPathCard
            title="I need healthcare"
            description="Medi-Cal providers, clinics, and specialty access."
            icon={Stethoscope}
            href="/healthcare"
            tone="slate"
          />
        </div>
      </SectionBlock>

      <SectionBlock title="How it works" subtitle="Clarity first. Action next." className="rounded-t-[40px] border-t border-primary/10">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="surface-card">
            <CardHeader>
              <Badge variant="secondary" className="w-fit">Step 1</Badge>
              <CardTitle className="mt-2 text-xl">Ask Virgil</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Describe what you need in plain language and get guided support instantly.
              </p>
            </CardContent>
          </div>
          <div className="surface-card">
            <CardHeader>
              <Badge variant="secondary" className="w-fit">Step 2</Badge>
              <CardTitle className="mt-2 text-xl">Get verified options</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We prioritize verified resources and practical next actions for your situation.
              </p>
            </CardContent>
          </div>
          <div className="surface-card">
            <CardHeader>
              <Badge variant="secondary" className="w-fit">Step 3</Badge>
              <CardTitle className="mt-2 text-xl">Take action today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Call, apply, visit, or message with confidence, without bouncing between systems.
              </p>
            </CardContent>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock title="Trusted public service footprint" subtitle="Real coverage, real activity, real support." className="rounded-t-[40px] border-t border-primary/10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => (
            <StatPill key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        title="Support the mission"
        subtitle="Help keep Virgil St free, up to date, and available to the people who need it most."
        className="rounded-t-[40px] border-t border-primary/10"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/get-involved">
            <div className="surface-card cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <HandHeart className="h-5 w-5 text-[var(--cta)]" />
                  Donate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Fund platform operations and direct community impact.</p>
              </CardContent>
            </div>
          </Link>
          <Link href="/get-involved">
            <div className="surface-card cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5 text-primary" />
                  Volunteer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Contribute time, outreach, or lived-experience guidance.</p>
              </CardContent>
            </div>
          </Link>
          <Link href="/get-involved">
            <div className="surface-card cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <HeartHandshake className="h-5 w-5 text-primary" />
                  Partner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Collaborate as a clinic, nonprofit, employer, or civic team.</p>
              </CardContent>
            </div>
          </Link>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Everything is easy to find"
        subtitle="Use the Explore menu in the header to jump to every module without cluttering this page."
        className="rounded-t-[40px] border-t border-primary/10 bg-card/60"
      >
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/treatment", label: "Treatment Centers" },
              { href: "/meetings", label: "Recovery Meetings" },
              { href: "/healthcare", label: "Healthcare Hub" },
              { href: "/medical-providers", label: "Medi-Cal Providers" },
              { href: "/events", label: "Community Events" },
              { href: "/articles", label: "Resource Library" },
              { href: "/forum", label: "Community Forum" },
              { href: "/videos", label: "Video Library" },
              { href: "/map", label: "Community Map" },
              { href: "/resources/map", label: "Resource Map" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="outline" size="sm">{item.label}</Button>
              </Link>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Grid2x2 className="h-4 w-4 text-primary" />
            Desktop: click Explore in the header. Mobile: open the top-right menu.
          </p>
        </div>
      </SectionBlock>

      <SectionBlock className="rounded-t-[40px] border-t border-primary/10 pt-0">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm md:p-12">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-foreground">Public infrastructure, redesigned for dignity.</h2>
            <p className="mt-3 text-muted-foreground">
              Start now and get a clear path to help today.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/chat">
                <Button size="lg" className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">
                  Talk to Virgil
                  <MessageSquare className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/resources">
                <Button size="lg" variant="outline">
                  Browse services
                </Button>
              </Link>
              <Link href="/get-involved#donate">
                <Button size="lg" variant="outline">
                  Donate
                  <HandHeart className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </SectionBlock>
    </PublicLayout>
  );
}
