import SiteShell from "@/components/SiteShell";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import MatchesSection from "@/components/home/MatchesSection";
import StagesSection from "@/components/home/StagesSection";

export default function HomePage() {
  return (
    <SiteShell theme="home">
      <Hero />
      <HowItWorks />
      <StagesSection />
      <MatchesSection />
    </SiteShell>
  );
}
