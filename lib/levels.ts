/*
 * How a player is ranked.
 *
 *   Instrument level   Beginner -> Intermediate -> Professional
 *   Global ranking     Developing -> Established -> World-Class
 *
 * A Beginner is unranked. Once a player's instrument reaches Intermediate
 * they enter the global ranking at Developing. The database enforces the same
 * rule (see supabase/schema.sql), and the values here match the ones stored in
 * the players table.
 */
export const INSTRUMENT_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "professional", label: "Professional" },
] as const;

export const GLOBAL_RANKS = [
  { value: "developing", label: "Developing" },
  { value: "established", label: "Established" },
  { value: "world_class", label: "World-Class" },
] as const;

export type InstrumentLevel = (typeof INSTRUMENT_LEVELS)[number]["value"];
export type GlobalRank = (typeof GLOBAL_RANKS)[number]["value"];

export function instrumentLevelLabel(value: string | null | undefined) {
  return INSTRUMENT_LEVELS.find((level) => level.value === value)?.label ?? "Beginner";
}

export function globalRankLabel(value: string | null | undefined) {
  return GLOBAL_RANKS.find((rank) => rank.value === value)?.label ?? "Unranked";
}
