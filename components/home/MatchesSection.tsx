import { getMatches } from "@/lib/mock-data";
import MatchCard from "../MatchCard";
import { ButtonLink, Container, SectionHeader } from "../ui";

export default function MatchesSection() {
  const matches = getMatches();

  return (
    <section id="matches" aria-labelledby="matches-title" className="bg-section-matches py-24 sm:py-32">
      <Container>
        <SectionHeader
          title={<span id="matches-title">On stage this week</span>}
          action={
            <ButtonLink href="/schedule" variant="outline">
              See all matches
            </ButtonLink>
          }
        >
          Ensembles are scored note by note while they play. Scores move in real time, and the final bar decides
          who takes the bonus.
        </SectionHeader>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:mt-20">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} themeByType={false} />
          ))}
        </div>
      </Container>
    </section>
  );
}
