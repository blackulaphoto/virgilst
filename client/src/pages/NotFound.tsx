import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";
import PublicLayout from "@/components/PublicLayout";
import SectionBlock from "@/components/SectionBlock";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <PublicLayout title="Page Not Found" subtitle="The page you requested may have moved or no longer exists.">
      <SectionBlock className="pt-8">
        <div className="flex items-center justify-center">
          <Card className="surface-card w-full max-w-lg">
            <CardContent className="pb-8 pt-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-[var(--cta)]/15 p-4">
                  <AlertCircle className="h-12 w-12 text-[var(--cta)]" />
                </div>
              </div>
              <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
              <h2 className="mb-4 text-xl font-semibold text-foreground">Page Not Found</h2>
              <p className="mb-8 text-muted-foreground">
                Sorry, we couldn't find that page.
              </p>
              <Button onClick={() => setLocation("/")} className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </SectionBlock>
    </PublicLayout>
  );
}
