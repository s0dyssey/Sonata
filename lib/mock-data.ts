/*
 * All mock data for the front-end mockup lives in this file.
 * Shapes mirror the tables we expect in Supabase (ensemble_types, ensembles,
 * matches), so these exports can later be replaced by queries that return
 * the same types.
 */

export type EnsembleType = "classical" | "contemporary";

export type EnsembleTypeInfo = {
  id: EnsembleType;
  name: string;
  href: string;
  cta: string;
  tagline: string;
  description: string;
  instruments: string[];
  activePlayers: number;
  activeEnsembles: number;
};

export type Ensemble = {
  id: string;
  name: string;
  type: EnsembleType;
  region: string;
};

export type MatchStatus = "live" | "upcoming";

export type Match = {
  id: string;
  type: EnsembleType;
  piece: string;
  round: string;
  status: MatchStatus;
  startsAt: string; // ISO 8601, UTC
  homeId: string;
  awayId: string;
  homeScore: number | null; // null until the match starts
  awayScore: number | null;
  progress: number | null; // 0..1 through the piece while live
};

export const season = {
  number: 3,
  name: "Season 3",
};

export const ensembleTypes: EnsembleTypeInfo[] = [
  {
    id: "classical",
    name: "Classical",
    href: "/classical",
    cta: "Play classical",
    tagline: "Sixty chairs. One downbeat.",
    description:
      "Take a seat in a full virtual orchestra. Strings, winds, brass and percussion play the season's repertoire together, and every section counts toward the result.",
    instruments: ["Violin", "Viola", "Cello", "Double bass", "Flute", "Clarinet", "Horn", "Trumpet", "Timpani"],
    activePlayers: 18420,
    activeEnsembles: 312,
  },
  {
    id: "contemporary",
    name: "Contemporary",
    href: "/contemporary",
    cta: "Play contemporary",
    tagline: "Tight sets. Loud rooms.",
    description:
      "Lock in with a four-to-seven piece band. Rhythm sections, horns and leads trade parts through the season's set list, scored on every hit.",
    instruments: ["Guitar", "Bass", "Drums", "Keys", "Vocals", "Saxophone", "Trumpet"],
    activePlayers: 24975,
    activeEnsembles: 4180,
  },
];

export const ensembles: Ensemble[] = [
  { id: "ember-phil", name: "Ember Philharmonic", type: "classical", region: "EU West" },
  { id: "vesper-sym", name: "Vesper Symphonia", type: "classical", region: "NA East" },
  { id: "rosewood-co", name: "Rosewood Chamber Orchestra", type: "classical", region: "APAC" },
  { id: "halcyon-sym", name: "Halcyon Symphony", type: "classical", region: "NA West" },
  { id: "low-tides", name: "The Low Tides", type: "contemporary", region: "NA West" },
  { id: "neon-harbor", name: "Neon Harbor", type: "contemporary", region: "EU North" },
  { id: "velvet-signal", name: "Velvet Signal", type: "contemporary", region: "LATAM" },
  { id: "static-bloom", name: "Static Bloom", type: "contemporary", region: "APAC" },
];

export const matches: Match[] = [
  {
    id: "m-301",
    type: "classical",
    piece: "Dvořák: Symphony No. 9, IV. Allegro con fuoco",
    round: "Week 6",
    status: "live",
    startsAt: "2026-10-11T18:00:00Z",
    homeId: "ember-phil",
    awayId: "vesper-sym",
    homeScore: 41280,
    awayScore: 39915,
    progress: 0.62,
  },
  {
    id: "m-302",
    type: "contemporary",
    piece: "Funk standards set (3 tunes)",
    round: "Week 6",
    status: "live",
    startsAt: "2026-10-11T18:30:00Z",
    homeId: "low-tides",
    awayId: "neon-harbor",
    homeScore: 12740,
    awayScore: 13105,
    progress: 0.34,
  },
  {
    id: "m-303",
    type: "classical",
    piece: "Holst: The Planets, Mars",
    round: "Week 7",
    status: "upcoming",
    startsAt: "2026-10-16T19:30:00Z",
    homeId: "rosewood-co",
    awayId: "halcyon-sym",
    homeScore: null,
    awayScore: null,
    progress: null,
  },
  {
    id: "m-304",
    type: "contemporary",
    piece: "Blues in F, open solos",
    round: "Week 10",
    status: "upcoming",
    startsAt: "2026-11-07T21:15:00Z",
    homeId: "velvet-signal",
    awayId: "static-bloom",
    homeScore: null,
    awayScore: null,
    progress: null,
  },
];

export function getEnsemble(id: string): Ensemble {
  const ensemble = ensembles.find((e) => e.id === id);
  if (!ensemble) throw new Error(`Unknown ensemble: ${id}`);
  return ensemble;
}

export function getEnsembleType(id: EnsembleType): EnsembleTypeInfo {
  const info = ensembleTypes.find((t) => t.id === id);
  if (!info) throw new Error(`Unknown ensemble type: ${id}`);
  return info;
}

export function getMatches(type?: EnsembleType): Match[] {
  return type ? matches.filter((m) => m.type === type) : matches;
}
