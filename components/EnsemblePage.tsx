import { getEnsembleType, getMatches, type EnsembleType } from "@/lib/mock-data";
import { getPieces } from "@/lib/pieces";
import MatchCard from "./MatchCard";
import SignedInOnly from "./SignedInOnly";
import SiteShell from "./SiteShell";
import { ButtonLink, Container, Headline, SectionHeader, StaffLines } from "./ui";

/* Hub for one ensemble type. Everything here (nav and footer
   included) is themed by the token set that SiteShell applies. */
export default function EnsemblePage({ type }: { type: EnsembleType }) {
  const info = getEnsembleType(type);
  const matches = getMatches(type);
  const hasPieces = getPieces(type).length > 0;

  return (
    <SiteShell theme={type}>
      <section className="relative overflow-hidden border-b border-line bg-bg text-ink">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-rule" />
        <Container className="flex flex-col items-start gap-6 pt-24 pb-16 sm:pt-32 sm:pb-20">
          <Headline as="h1" size="xl" className="max-w-4xl">
            {info.name}
          </Headline>
          <p className="max-w-2xl text-lg leading-relaxed text-muted">{info.description}</p>
          {/* The Play button is for signed-in players only, and only on a stage that has a piece to play. */}
          {hasPieces && (
            <SignedInOnly>
              <ButtonLink href="/play" className="mt-2">
                {info.cta}
              </ButtonLink>
            </SignedInOnly>
          )}
        </Container>
        <StaffLines className="mb-14 h-16 w-full text-rule/45" />
      </section>

      <section aria-labelledby="ensemble-matches" className="bg-tint py-20 sm:py-28">
        <Container>
          <SectionHeader title={<span id="ensemble-matches">This week&rsquo;s matches</span>} />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </Container>
      </section>
    </SiteShell>
  );
}
