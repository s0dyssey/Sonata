import { GLOBAL_RANKS, INSTRUMENT_LEVELS } from "@/lib/levels";
import { ButtonLink, Container, SectionHeader } from "../ui";

const steps = [
  {
    title: "Connect your instrument",
    body: "Plug in over USB or MIDI, or play into any mic. A one-minute calibration learns your instrument's range and tuning.",
  },
  {
    title: "Play the piece",
    body: "Join your ensemble for the week's set piece. Everyone plays their own part, live, at the same time.",
  },
  {
    title: "Get scored live",
    body: "Every note is scored for pitch and timing as you play. Your ensemble's combined score decides the match.",
  },
  {
    title: "Climb the ranks",
    body: "Bank individual points, plus a bonus when your ensemble wins or a penalty when it loses. Reach Intermediate on your instrument and you enter the global ranking.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="bg-section-how py-24 sm:py-32">
      <Container>
        <SectionHeader
          title={<span id="how-title">From first note to global rank</span>}
          action={<ButtonLink href="#stages">Start your first season</ButtonLink>}
        >
          No studio, no audition. If you can play it, you can compete: the league scores what you play, not the gear
          you play it on.
        </SectionHeader>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-4 bg-surface p-6 sm:p-8">
              <span aria-hidden="true" className="font-display text-6xl font-black leading-none tracking-tight text-rule">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-xl font-bold uppercase tracking-tight">{step.title}</h3>
              <p className="leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-8 rounded-md border border-line bg-surface p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Season points</p>
            <p className="mt-3 text-lg leading-relaxed text-ink sm:text-xl">
              Your points <span className="text-muted">+</span> win bonus{" "}
              <span className="text-muted">or</span> <span className="text-muted">&minus;</span> loss penalty
            </p>
            <p className="mt-4 max-w-md leading-relaxed text-muted">
              Beginners are unranked. Reach Intermediate on your instrument and you enter the global ranking at
              Developing.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <Ladder label="Instrument level" steps={INSTRUMENT_LEVELS} />
            <Ladder label="Global ranking" steps={GLOBAL_RANKS} filled />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* One row of steps joined by arrows, such as Beginner -> Intermediate -> Professional. */
function Ladder({
  label,
  steps,
  filled = false,
}: {
  label: string;
  steps: ReadonlyArray<{ value: string; label: string }>;
  filled?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{label}</p>
      <ol className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em]">
        {steps.map((step, i) => (
          <li key={step.value} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden="true" className="text-muted">
                &rarr;
              </span>
            )}
            <span
              className={
                filled
                  ? "rounded-[3px] bg-accent px-3 py-2 text-on-accent"
                  : "rounded-[3px] border border-line px-3 py-2 text-ink"
              }
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
