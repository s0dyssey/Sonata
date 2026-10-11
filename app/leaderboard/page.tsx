import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import { Container, Headline } from "@/components/ui";

export const metadata: Metadata = {
  title: "Leaderboard",
};

// The global leaderboard (Developing, Established and World-Class players)
// will live here. Not built yet.
export default function LeaderboardPage() {
  return (
    <SiteShell theme="base">
      <Container className="flex flex-1 flex-col gap-5 py-24 sm:py-32">
        <Headline as="h1" size="xl">
          Leaderboard
        </Headline>
        <p className="text-2xl font-light italic text-muted">Coming soon</p>
      </Container>
    </SiteShell>
  );
}
