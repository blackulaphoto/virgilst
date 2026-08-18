import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PublicLayout from "@/components/PublicLayout";
import { Link } from "wouter";
import { ClipboardList, ArrowRight, ListChecks } from "lucide-react";

export default function CaseManager() {
  return (
    <PublicLayout
      title="Work with an AI Case Manager"
      subtitle="A guided conversation that turns into a real, trackable plan — not just a list of links."
    >
      <div className="container max-w-3xl section-space">
        <Card className="surface-card p-8 text-center">
          <CardContent className="flex flex-col items-center gap-4 p-0">
            <ClipboardList className="h-14 w-14 text-primary" />
            <p className="max-w-lg text-muted-foreground">
              Tell me what's going on — housing, money, health, anything. I'll figure out what needs
              attention first, build you a plan with concrete next steps, and match you to real resources
              as we go.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/case-manager/assessment">
                <Button size="lg" className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">
                  Start my assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/case-manager/dashboard">
                <Button size="lg" variant="outline">
                  <ListChecks className="mr-2 h-4 w-4" />
                  View my plan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
