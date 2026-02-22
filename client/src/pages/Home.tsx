import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import PublicLayout from "@/components/PublicLayout";
import SectionBlock from "@/components/SectionBlock";
import ActionPathCard from "@/components/ActionPathCard";
import StatPill from "@/components/StatPill";
import SurfaceCard from "@/components/SurfaceCard";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  ListChecks,
  CalendarDays,
  Heart,
  LogIn,
  LogOut,
  User,
  MapPin,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const resourceHighlights = [
  {
    title: "Housing Assistance",
    description: "Shelter access, prevention, rapid rehousing, and supportive housing pathways.",
    href: "/resources/housing",
    tag: "Housing",
  },
  {
    title: "Food and Grocery Support",
    description: "Food pantries, hot meal distribution, and verified food service programs.",
    href: "/resources/food",
    tag: "Food",
  },
  {
    title: "Jobs and Training",
    description: "Entry-level work, hiring-now categories, and realistic next-step opportunities.",
    href: "/jobs",
    tag: "Work",
  },
  {
    title: "Healthcare and Medi-Cal",
    description: "Find providers by specialty, city, language, and accepted network.",
    href: "/medical-providers",
    tag: "Healthcare",
  },
];

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
      <SectionBlock className="pt-10 md:pt-16">
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
      </SectionBlock>

      <SectionBlock
        title="Choose your next step"
        subtitle="Start with the need you have right now. Each path takes you directly to verified programs and actionable options."
        className="bg-card/60"
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
            href="/medical-providers"
            tone="slate"
          />
        </div>
      </SectionBlock>

      <SectionBlock title="How it works" subtitle="Clarity first. Action next.">
        <div className="grid gap-4 md:grid-cols-3">
          <SurfaceCard>
            <CardHeader>
              <Badge variant="secondary" className="w-fit">Step 1</Badge>
              <CardTitle className="mt-2 text-xl">Ask Virgil</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Describe what you need in plain language and get guided support instantly.
              </p>
            </CardContent>
          </SurfaceCard>
          <SurfaceCard>
            <CardHeader>
              <Badge variant="secondary" className="w-fit">Step 2</Badge>
              <CardTitle className="mt-2 text-xl">Get verified options</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We prioritize verified resources and practical next actions for your situation.
              </p>
            </CardContent>
          </SurfaceCard>
          <SurfaceCard>
            <CardHeader>
              <Badge variant="secondary" className="w-fit">Step 3</Badge>
              <CardTitle className="mt-2 text-xl">Take action today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Call, apply, visit, or message with confidence, without bouncing between systems.
              </p>
            </CardContent>
          </SurfaceCard>
        </div>
      </SectionBlock>

      <SectionBlock title="Trusted public service footprint" subtitle="Real coverage, real activity, real support.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => (
            <StatPill key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Explore core services" subtitle="High-impact pathways designed for quick decisions and clear next moves." className="bg-card/60">
        <div className="grid gap-4 md:grid-cols-2">
          {resourceHighlights.map(item => (
            <Link key={item.title} href={item.href}>
              <SurfaceCard className="cursor-pointer">
                <CardHeader>
                  <Badge variant="outline" className="w-fit text-xs">
                    {item.tag}
                  </Badge>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">{item.description}</CardDescription>
                </CardHeader>
              </SurfaceCard>
            </Link>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock className="pt-0">
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
            </div>
          </div>
        </div>
      </SectionBlock>
    </PublicLayout>
  );
}
