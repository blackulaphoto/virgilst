import PublicLayout from "@/components/PublicLayout";
import HeroSection from "@/components/home/HeroSection";
import FastPathSection from "@/components/home/FastPathSection";
import NextStepsSection from "@/components/home/NextStepsSection";
import StatsStrip from "@/components/home/StatsStrip";

export default function Home() {
  return (
    <PublicLayout>
      <HeroSection />
      <FastPathSection />
      <NextStepsSection />
      <StatsStrip />
    </PublicLayout>
  );
}
