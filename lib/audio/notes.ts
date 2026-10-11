// Turning a frequency into a note name. Used by the sound check now and by
// scoring later.

const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

export type NoteReading = {
  name: string; // "A", "C♯", "B♭"...
  octave: number; // 4 for the A above middle C
  midi: number; // nearest note as a MIDI number: 69 is A4, 60 is middle C
  cents: number; // how far from that note, -50 (flat) to +50 (sharp)
  hertz: number;
};

// Fractional MIDI number for a frequency: 69.0 is A4 exactly, 69.5 is halfway to B♭.
export function hertzToMidi(hertz: number) {
  return 69 + 12 * Math.log2(hertz / 440);
}

export function midiToHertz(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

// 68 -> "A♭4"
export function midiName(midi: number) {
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

// The score's own spelling, with proper signs: "Ab4" -> "A♭4", "G#4" -> "G♯4".
export function prettyNoteName(name: string) {
  return name.replace(/^([A-G])b/, "$1♭").replace(/^([A-G])#/, "$1♯");
}

// Moves a written note name by whole octaves: ("Ab4", -2) -> "Ab2".
export function shiftOctave(name: string, octaves: number) {
  return name.replace(/-?\d+$/, (octave) => String(Number(octave) + octaves));
}

const SEMITONES_FROM_C: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// "C4" -> 60, "Ab4" -> 68, "F#3" -> 54. Flats are written with a lowercase b.
export function nameToMidi(name: string) {
  const match = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!match) throw new Error(`"${name}" is not a note name like C4, Ab4 or F#3`);
  const [, letter, accidental, octave] = match;
  const shift = accidental === "#" ? 1 : accidental === "b" ? -1 : 0;
  return (Number(octave) + 1) * 12 + SEMITONES_FROM_C[letter] + shift;
}

export function readNote(hertz: number): NoteReading {
  const exact = hertzToMidi(hertz);
  const midi = Math.round(exact);
  return {
    name: NOTE_NAMES[((midi % 12) + 12) % 12],
    octave: Math.floor(midi / 12) - 1,
    midi,
    cents: Math.round((exact - midi) * 100),
    hertz,
  };
}
