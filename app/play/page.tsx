import type { Metadata } from "next";
import MicCheck from "@/components/play/MicCheck";
import SiteShell from "@/components/SiteShell";
import { Container, Headline } from "@/components/ui";
import { decayAndDestruction } from "@/lib/pieces";

export const metadata: Metadata = {
  title: "Sound check",
};

/* Signed-in players only: /play is listed in PROTECTED_PREFIXES
   (lib/supabase/proxy.ts), so signed-out visitors are sent to /login first. */
export default function PlayPage() {
  return (
    <SiteShell theme="base">
      <Container className="flex flex-1 flex-col gap-10 py-16 sm:py-24">
        <div className="flex flex-col gap-5">
          <Headline as="h1" size="xl">
            Sound check
          </Headline>
          <p className="max-w-2xl text-lg leading-relaxed text-muted">
            Make sure SONATA can hear your instrument. Play one note at a time, and keep any backing sound in
            headphones so the mic only hears you.
          </p>
        </div>

        <MicCheck playHref={`/play/${decayAndDestruction.id}`} />
      </Container>
    </SiteShell>
  );
}
