// The instrument a player competes on. Rankings are per instrument, so this is
// stored on the player's row. Players pick it from their account after signing
// up, so a new player has none yet. Voice is first because the mic is the MVP instrument.
export const INSTRUMENTS = [
  { value: "voice", label: "Voice" },
  { value: "violin", label: "Violin" },
  { value: "viola", label: "Viola" },
  { value: "cello", label: "Cello" },
  { value: "double-bass", label: "Double bass" },
  { value: "flute", label: "Flute" },
  { value: "clarinet", label: "Clarinet" },
  { value: "saxophone", label: "Saxophone" },
  { value: "horn", label: "Horn" },
  { value: "trumpet", label: "Trumpet" },
  { value: "guitar", label: "Guitar" },
  { value: "bass", label: "Bass" },
  { value: "keys", label: "Keys" },
  { value: "drums", label: "Drums" },
  { value: "timpani", label: "Timpani" },
] as const;

export type Instrument = (typeof INSTRUMENTS)[number]["value"];

export function instrumentLabel(value: string | null | undefined) {
  return INSTRUMENTS.find((instrument) => instrument.value === value)?.label ?? "Not chosen yet";
}

export function isInstrument(value: unknown): value is Instrument {
  return INSTRUMENTS.some((instrument) => instrument.value === value);
}
