import { getEnsemble, season, type Match } from "@/lib/mock-data";

const startFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});

const typeLabel: Record<Match["type"], string> = {
  classical: "Classical",
  contemporary: "Contemporary",
};

function StatusBadge({ status }: { status: Match["status"] }) {
  if (status === "live") {
    return (
      <span className="inline-flex shrink-0 items-center gap-2 rounded-[3px] bg-surface px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-accent">
        <span aria-hidden="true" className="relative flex size-2">
          <span className="absolute inline-flex size-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex size-2 rounded-full bg-current" />
        </span>
        Live
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-[3px] border border-current px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] opacity-90">
      Upcoming
    </span>
  );
}

/*
 * One match, top to bottom:
 *   colored band   stage and round on the left, Live / Upcoming on the right
 *   season         small and muted
 *   the two sides  the headline
 *   the piece      italic, in the accent color
 *   status         "Scoring underway", or the start time
 *
 * By default the card sets data-theme from the match's ensemble type, so it
 * picks up the Classical or Contemporary palette. With themeByType={false} it
 * inherits the surrounding theme instead (the home page keeps its cards purple).
 */
export default function MatchCard({ match, themeByType = true }: { match: Match; themeByType?: boolean }) {
  const home = getEnsemble(match.homeId);
  const away = getEnsemble(match.awayId);
  const live = match.status === "live";

  return (
    <article
      data-theme={themeByType ? match.type : undefined}
      className="flex flex-col overflow-hidden rounded-md border border-line bg-surface text-ink"
    >
      <header className="flex items-center justify-between gap-4 bg-button px-5 py-4 text-on-button sm:px-6">
        <p className="text-sm font-bold uppercase tracking-[0.14em]">
          {typeLabel[match.type]} <span aria-hidden="true">|</span> {match.round}
        </p>
        <StatusBadge status={match.status} />
      </header>

      <div className="flex flex-1 flex-col px-5 pb-6 pt-5 sm:px-6">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted">{season.name}</p>

        <h3 className="mt-1 text-2xl font-extrabold uppercase leading-[1.05] tracking-tight text-balance sm:text-3xl">
          {home.name} <span className="font-medium lowercase">v.</span> {away.name}
        </h3>

        <p className="mt-2 text-lg italic text-accent">{match.piece}</p>

        <p className="mt-auto flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-8 text-sm font-medium uppercase tracking-[0.14em] text-muted">
          {live ? (
            <span>Scoring underway</span>
          ) : (
            <span>
              Starts <time dateTime={match.startsAt}>{startFormat.format(new Date(match.startsAt))} UTC</time>
            </span>
          )}
        </p>
      </div>
    </article>
  );
}
