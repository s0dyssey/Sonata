import Link from "next/link";
import type { CSSProperties } from "react";
import type { EnsembleType, EnsembleTypeInfo } from "@/lib/mock-data";
import { getPieces } from "@/lib/pieces";
import SignedInOnly from "./SignedInOnly";
import { ArrowRight, StaffLines } from "./ui";

/* What each card lights up with on hover: a top-to-bottom gradient, dark red
   to orange-red for Classical and deep blue to bright blue for Contemporary,
   with white text. These two cards are the only gradients on the site. */
const glow: Record<EnsembleType, { fill: string; ink: string; line: string }> =
  {
    classical: {
      fill: "linear-gradient(to bottom, #771b1a, #c43a1c 85%, #c83b1d)",
      ink: "#ffffff",
      line: "rgb(255 255 255 / 0.45)",
    },
    contemporary: {
      fill: "linear-gradient(to bottom, #1a5180, #1b77b4 85%, #1c7dbc)",
      ink: "#ffffff",
      line: "rgb(255 255 255 / 0.45)",
    },
  };

/* The card's text and line colors are variables. At rest they are the page's
   neutrals; on hover (or keyboard focus) they switch to the glow colors, and
   everything inside follows because it reads the same variables. The gradient
   itself is a layer behind the content that fades in, since a browser cannot
   fade between a flat color and a gradient. */
const atRest =
  "[--c-ink:var(--ink)] [--c-soft:var(--muted)] [--c-line:var(--line)] [--c-chip:var(--surface)] [--c-button-text:var(--bg)]";
const hovered =
  "hover:[--c-ink:var(--on-glow)] hover:[--c-soft:var(--on-glow)] hover:[--c-line:var(--glow-line)] hover:[--c-chip:transparent] hover:[--c-button-text:var(--ink)]";
const focused =
  "focus-visible:[--c-ink:var(--on-glow)] focus-visible:[--c-soft:var(--on-glow)] focus-visible:[--c-line:var(--glow-line)] focus-visible:[--c-chip:transparent] focus-visible:[--c-button-text:var(--ink)]";

/* Large linked card for one ensemble type: neutral off-white until you point
   at it, then it fills with that stage's gradient. */
export default function StageCard({ stage }: { stage: EnsembleTypeInfo }) {
  const colors = glow[stage.id];
  const hasPieces = getPieces(stage.id).length > 0;

  return (
    <Link
      href={stage.href}
      style={
        { "--on-glow": colors.ink, "--glow-line": colors.line } as CSSProperties
      }
      className={`${atRest} ${hovered} ${focused} group relative isolate flex flex-col overflow-hidden rounded-md border border-[var(--c-line)] bg-bg p-6 text-[var(--c-ink)] transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-safe:hover:-translate-y-1 sm:p-10`}
    >
      <span
        aria-hidden="true"
        style={{ backgroundImage: colors.fill }}
        className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
      />

      {/* Bleeds to the card edges. A fixed height keeps the two cards' titles level. */}
      <div className="-mx-6 pt-4 pb-12 sm:-mx-10">
        <StaffLines className="h-12 w-full text-[var(--c-line)] transition-colors duration-300" />
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
          {stage.name}
        </h3>
        <p className="max-w-md leading-relaxed text-[var(--c-soft)] transition-colors duration-300">
          {stage.description}
        </p>

        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Instruments">
          {stage.instruments.map((instrument) => (
            <li
              key={instrument}
              className="rounded-full border border-[var(--c-line)] bg-[var(--c-chip)] px-3 py-1 text-xs transition-colors duration-300"
            >
              {instrument}
            </li>
          ))}
        </ul>

        {/* The Play button is for signed-in players only, and only on a stage that
            has a piece to play. It takes the card's text color, so it flips with the card. */}
        {hasPieces && (
          <SignedInOnly>
            <span className="mt-6 inline-flex h-12 w-fit items-center gap-3 rounded-[3px] bg-[var(--c-ink)] px-6 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--c-button-text)] transition-colors duration-300">
              {stage.cta}
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </span>
          </SignedInOnly>
        )}
      </div>
    </Link>
  );
}
