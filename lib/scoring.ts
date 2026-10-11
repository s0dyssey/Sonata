import { hertzToMidi } from "@/lib/audio/notes";
import { beatsToSeconds, type Piece, type PieceNote } from "@/lib/pieces/types";

/*
 * How a run is scored.
 *
 * Pitch is what counts. For each note the scorer adds up how long the player
 * held the right pitch, and compares that with the note's length:
 *
 *   On pitch       within half a semitone of the note, in any octave
 *   Full credit    on pitch for half the note's length or more. The rest allows
 *                  for breaths, consonants and sliding between notes.
 *   Hit or miss    a note counts as hit when it was on pitch for 30% of its length
 *   Score          the average credit of all notes, out of 100
 *   Rests          not scored; sound during a rest costs nothing
 *
 * Timing is followed rather than punished. Nobody sings exactly on the click:
 * a real singer is typically a tenth of a second either side of it and drifts
 * faster or slower over a piece. So each note is listened for where the
 * player's timing so far says it will fall, not at a fixed moment. How far
 * ahead of or behind the beat they ended up is reported next to the score.
 *
 * These numbers were set against a real recording of the piece being sung.
 * They are the knobs to turn to make scoring kinder or stricter.
 */
export const IN_TUNE_SEMITONES = 0.5;
export const FULL_CREDIT_AT = 0.5; // share of the note's length held on pitch for full credit
export const HIT_AT = 0.3; // share of the note's length held on pitch to count as a hit
export const TIMING_MARGIN = 0.12; // seconds either side of a note in which it is still listened for
export const FOLLOW_RATE = 0.5; // 0 never adjusts to the player's timing, 1 jumps to it at once
export const MAX_LAG = 1; // seconds; the furthest ahead of or behind the beat the scorer will follow

export type NoteGrade = "hit" | "miss";

export type RunResult = {
  score: number; // 0 to 100
  hits: number;
  notes: number;
  grades: NoteGrade[]; // one per note, in order
  lag: number; // seconds behind the beat at the end (negative means ahead)
};

/* What the scorer made of one reading from the mic. */
export type Reading = {
  listeningFor: number; // index of the note being listened for right now, or -1 between notes
  onPitch: boolean; // whether this reading was the right pitch for that note
  offBy: number | null; // semitones above (+) or below (-) that note, ignoring octaves
};

// Moves a pitch by whole octaves until it is as close as possible to the
// target, so singing the tune an octave lower still lands on the notes.
export function foldToward(midi: number, target: number) {
  return midi + 12 * Math.round((target - midi) / 12);
}

/* How far a heard pitch is from a note, in semitones, ignoring octaves.
   Positive is too high. Null when nothing clear was heard. */
export function semitonesOff(hertz: number | null, note: PieceNote) {
  if (hertz === null) return null;
  return foldToward(hertzToMidi(hertz), note.midi) - note.midi;
}

export function isOnPitch(hertz: number | null, note: PieceNote) {
  const off = semitonesOff(hertz, note);
  return off !== null && Math.abs(off) <= IN_TUNE_SEMITONES;
}

/*
 * Scores one run. Feed it every reading from the mic, in order:
 *
 *   const scorer = createScorer(piece);
 *   scorer.read(time, hertz);   // time in seconds since the start of bar 1
 *   scorer.grades               // "hit", "miss" or null (not reached yet), per note
 *   scorer.score()              // the score so far
 *   scorer.finish()             // grades whatever is left and returns the result
 */
export function createScorer(piece: Piece) {
  const notes = piece.notes.map((note) => ({
    note,
    start: beatsToSeconds(piece, note.beat),
    end: beatsToSeconds(piece, note.beat + note.beats),
    held: 0, // seconds on pitch
    weightedTime: 0, // for finding the middle of when it was sung
  }));
  const grades: Array<NoteGrade | null> = notes.map(() => null);

  let lag = 0; // seconds the player is behind the beat (negative: ahead)
  let graded = 0; // notes before this index are finished
  let lastTime: number | null = null;

  const creditOf = (index: number) => {
    const { held, start, end } = notes[index];
    return Math.min(1, held / ((end - start) * FULL_CREDIT_AT));
  };

  const close = (index: number) => {
    const entry = notes[index];
    const length = entry.end - entry.start;
    const hit = entry.held >= length * HIT_AT;
    grades[index] = hit ? "hit" : "miss";

    // Learn the player's timing from the notes they hit: compare the middle of
    // when they sang it with the middle of where it was expected.
    if (hit) {
      const sungAt = entry.weightedTime / entry.held;
      const expectedAt = (entry.start + entry.end) / 2 + lag;
      lag = Math.max(-MAX_LAG, Math.min(MAX_LAG, lag + FOLLOW_RATE * (sungAt - expectedAt)));
    }
  };

  const score = () => {
    if (notes.length === 0) return 0;
    const earned = notes.reduce((sum, _entry, index) => sum + creditOf(index), 0);
    return Math.round((earned / notes.length) * 100);
  };

  return {
    grades,
    score,
    lag: () => lag,

    read(time: number, hertz: number | null): Reading {
      // How much time this reading stands for. Capped so a stalled tab can't
      // hand out a long stretch of credit in one go.
      const step = lastTime === null ? 0 : Math.min(0.1, Math.max(0, time - lastTime));
      lastTime = time;

      // Close every note whose listening window has fully gone by.
      while (graded < notes.length && time >= notes[graded].end + lag + TIMING_MARGIN) {
        close(graded);
        graded++;
      }

      // Credit the reading to any open note it falls inside and matches.
      for (let index = graded; index < notes.length; index++) {
        const entry = notes[index];
        if (time < entry.start + lag - TIMING_MARGIN) break;
        if (time < entry.end + lag + TIMING_MARGIN && isOnPitch(hertz, entry.note)) {
          entry.held += step;
          entry.weightedTime += step * time;
        }
      }

      // The note the player should be on right now, by their own timing.
      const listeningFor = notes.findIndex((entry) => time >= entry.start + lag && time < entry.end + lag);
      const current = listeningFor === -1 ? null : notes[listeningFor].note;
      return {
        listeningFor,
        onPitch: current !== null && isOnPitch(hertz, current),
        offBy: current ? semitonesOff(hertz, current) : null,
      };
    },

    finish(): RunResult {
      while (graded < notes.length) {
        close(graded);
        graded++;
      }
      const finalGrades = grades.map((result) => result ?? "miss");
      return {
        score: score(),
        hits: finalGrades.filter((result) => result === "hit").length,
        notes: notes.length,
        grades: finalGrades,
        lag,
      };
    },
  };
}

/* One plain line about the player's timing, for the result screen. */
export function describeTiming(lag: number) {
  const amount = Math.abs(lag);
  if (amount < 0.12) return "Right on the beat";
  const seconds = amount.toFixed(1);
  return lag < 0 ? `About ${seconds} s ahead of the beat by the end` : `About ${seconds} s behind the beat by the end`;
}
