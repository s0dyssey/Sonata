import { nameToMidi } from "@/lib/audio/notes";

/* One note of a piece, placed on the beat grid. */
export type PieceNote = {
  name: string; // as written in the score: "Ab4"
  midi: number; // 68 for Ab4; what the mic's pitch is compared against
  bar: number; // 1 for the first bar
  beat: number; // beats from the start of the piece: 0 is the first beat of bar 1
  beats: number; // how long it lasts: 1 is a quarter note in 4/4
};

/* Which side of the league a piece belongs to. It is only offered there. */
export type PieceStage = "classical" | "contemporary";

export type Piece = {
  id: string;
  title: string;
  stage: PieceStage;
  bpm: number; // quarter notes per minute
  beatsPerBar: number;
  bars: number;
  totalBeats: number;
  notes: PieceNote[];
};

/*
 * Builds a piece from one string per bar, so the data reads like the score:
 *
 *   "C5 Ab4 G4 Ab4"   four quarter notes
 *   "G4:2 E4 E4"      a half note, then two quarters (":2" means two beats)
 *   "R:4"             a whole bar of rest
 *
 * It checks that every bar adds up to the time signature, so a typo fails
 * loudly instead of quietly shifting every note after it.
 */
export function definePiece(input: {
  id: string;
  title: string;
  stage: PieceStage;
  bpm: number;
  beatsPerBar: number;
  bars: string[];
}): Piece {
  const notes: PieceNote[] = [];

  input.bars.forEach((barText, barIndex) => {
    let beatInBar = 0;

    for (const token of barText.trim().split(/\s+/)) {
      const [name, length] = token.split(":");
      const beats = length ? Number(length) : 1;
      if (!(beats > 0)) throw new Error(`${input.title}, bar ${barIndex + 1}: "${token}" has no valid length`);

      if (name !== "R") {
        notes.push({
          name,
          midi: nameToMidi(name),
          bar: barIndex + 1,
          beat: barIndex * input.beatsPerBar + beatInBar,
          beats,
        });
      }
      beatInBar += beats;
    }

    if (beatInBar !== input.beatsPerBar) {
      throw new Error(`${input.title}, bar ${barIndex + 1} adds up to ${beatInBar} beats, not ${input.beatsPerBar}`);
    }
  });

  return {
    id: input.id,
    title: input.title,
    stage: input.stage,
    bpm: input.bpm,
    beatsPerBar: input.beatsPerBar,
    bars: input.bars.length,
    totalBeats: input.bars.length * input.beatsPerBar,
    notes,
  };
}

/* Beats to seconds at the piece's tempo: at 120 bpm one beat is half a second. */
export function beatsToSeconds(piece: Pick<Piece, "bpm">, beats: number) {
  return (beats * 60) / piece.bpm;
}
