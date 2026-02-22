import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface SurfaceCardProps {
  className?: string;
  children: ReactNode;
}

export default function SurfaceCard({ className = "", children }: SurfaceCardProps) {
  return <Card className={`surface-card ${className}`}>{children}</Card>;
}
