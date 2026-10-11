import { definePiece } from "./types";

/*
 * "Decay and Destruction", the team's original piece.
 * Transcribed from the score: 4/4 at 120 bpm, every note a quarter note,
 * treble staff only (the bass staff is rests throughout).
 *
 * Written here exactly as in the score: C5 at the top, down to B3. The play
 * screen moves it to whichever octave the player actually sings or plays in.
 *
 * An accidental lasts to the end of its bar, so the last note of bar 2 is Ab
 * (the flat from earlier in the bar) and the last note of bar 7 is Eb.
 */
export const decayAndDestruction = definePiece({
  id: "decay-and-destruction",
  title: "Decay and Destruction",
  stage: "classical",
  bpm: 120,
  beatsPerBar: 4,
  bars: [
    "R:4", //            bar 1: rest
    "C5 Ab4 G4 Ab4", //  bar 2
    "B4 G#4 G4 Ab4", //  bar 3
    "Bb4 G4 Eb4 G4", //  bar 4
    "A4 F4 Eb4 F4", //   bar 5
    "Ab4 F4 Eb4 F4", //  bar 6
    "G4 Eb4 D4 Eb4", //  bar 7
    "Gb4 Eb4 D4 C4", //  bar 8
    "G4 D4 C4 B3", //    bar 9
    "R:4", //            bar 10: rest
  ],
});
