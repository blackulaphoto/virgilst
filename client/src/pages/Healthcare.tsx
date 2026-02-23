import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, ShieldPlus, Building2, Activity, Syringe, HeartPulse, ArrowRight } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import SectionBlock from "@/components/SectionBlock";

const healthcarePaths = [
  {
    title: "Medi-Cal Providers",
    description: "Doctors and clinics accepting Medi-Cal with specialty and city filters.",
    href: "/medical-providers",
    icon: Stethoscope,
  },
  {
    title: "BCBS and Private Insurance",
    description: "Find non-Medi-Cal and private-insurance options, including BCBS listings.",
    href: "/treatment?insurance=private",
    icon: ShieldPlus,
  },
  {
    title: "Urgent Care",
    description: "Fast access to urgent-care providers and same-day clinic options.",
    href: "/medical-providers?category=urgent_care",
    icon: Activity,
  },
  {
    title: "Suboxone Clinics",
    description: "Find treatment centers and clinics that offer MAT and suboxone support.",
    href: "/healthcare/suboxone",
    icon: HeartPulse,
  },
  {
    title: "Needle Exchange and Harm Reduction",
    description: "Access needle exchange and harm-reduction resources near you.",
    href: "/search?q=needle%20exchange",
    icon: Syringe,
  },
  {
    title: "Treatment Centers",
    description: "Detox, residential, outpatient, dual diagnosis, and sober living.",
    href: "/treatment",
    icon: Building2,
  },
];

export default function Healthcare() {
  return (
    <PublicLayout
      title="Healthcare Access"
      subtitle="Choose the healthcare path that matches your needs. Medi-Cal is one option, not the only option."
      actions={
        <Link href="/submit-service/medi_cal_provider">
          <Button size="sm" className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">
            Submit a healthcare service
          </Button>
        </Link>
      }
    >
      <SectionBlock
        title="Choose your healthcare path"
        subtitle="Use these entry points for insurance-specific care, urgent needs, and harm-reduction support."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {healthcarePaths.map((path) => {
            const Icon = path.icon;
            return (
              <Link key={path.title} href={path.href}>
                <Card className="surface-card h-full cursor-pointer">
                  <CardHeader>
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{path.title}</CardTitle>
                    <CardDescription>{path.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="inline-flex items-center text-sm font-medium text-primary">
                      Open
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </SectionBlock>

      <SectionBlock className="pt-0">
        <Card className="surface-card">
          <CardHeader>
            <CardTitle>Not sure where to start?</CardTitle>
            <CardDescription>Ask Virgil and get a practical path based on your situation and location.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/chat">
              <Button className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">
                Ask Virgil
              </Button>
            </Link>
            <Link href="/resources/dental">
              <Button variant="outline">Healthcare and dental resources</Button>
            </Link>
          </CardContent>
        </Card>
      </SectionBlock>
    </PublicLayout>
  );
}
