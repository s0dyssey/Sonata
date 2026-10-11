import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import { Container, Headline } from "@/components/ui";

export const metadata: Metadata = {
  title: "Schedule",
};

// Every match of the season, past and upcoming, will be listed here.
// Not built yet. "See all matches" on the home page leads to this page.
export default function SchedulePage() {
  return (
    <SiteShell theme="base">
      <Container className="flex flex-1 flex-col gap-5 py-24 sm:py-32">
        <Headline as="h1" size="xl">
          Schedule
        </Headline>
        <p className="text-2xl font-light italic text-muted">Coming soon</p>
      </Container>
    </SiteShell>
  );
}
