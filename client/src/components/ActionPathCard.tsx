import { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Tone = "teal" | "sky" | "coral" | "slate";

const toneClasses: Record<Tone, string> = {
  teal: "bg-primary/10 text-primary",
  sky: "bg-accent/20 text-accent-foreground",
  coral: "bg-[var(--cta)]/15 text-[var(--cta)]",
  slate: "bg-secondary text-secondary-foreground",
};

export interface ActionPathCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  tone?: Tone;
}

export default function ActionPathCard({
  title,
  description,
  icon: Icon,
  href,
  tone = "teal",
}: ActionPathCardProps) {
  return (
    <Link href={href}>
      <Card className="surface-card h-full cursor-pointer">
        <CardHeader>
          <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
