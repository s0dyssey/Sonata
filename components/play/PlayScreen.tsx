"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scheduleMetronome } from "@/lib/audio/metronome";
import {
  hertzToMidi,
  midiName,
  midiToHertz,
  prettyNoteName,
  readNote,
  shiftOctave,
  type NoteReading,
} from "@/lib/audio/notes";
import { useMic, type MicFrame } from "@/lib/audio/use-mic";
import { beatsToSeconds, type Piece, type PieceNote } from "@/lib/pieces";
import { createScorer, describeTiming, foldToward, type NoteGrade, type RunResult } from "@/lib/scoring";
import { Button, ButtonLink, Container, Headline, cx } from "../ui";

/*
 * The play screen.
 *
 * The lane is a strip of time. Notes travel right to left and should be played
 * as they cross the white "now" line. Height is pitch: higher notes sit higher.
 * The player's own pitch is the dot on the now line, leaving a trail behind it,
 * so being in tune means keeping the dot inside the note.
 *
 * Everything is timed on the audio clock (frame.time), the same clock the
 * metronome clicks are scheduled on.
 *
 * Octaves: the piece is stored at the pitch it is written, but people sing and
 * play it in whatever octave suits them. The screen works out which octave the
 * player is in and labels the lane to match, so the note names shown are the
 * notes actually being made. Scoring accepts any octave.
 *
 * Scoring (the rules are in lib/scoring.ts) is about pitch, and it follows the
 * player's timing instead of punishing it: the note lit up in white is the one
 * being listened for, which can be a little ahead of or behind the white line
 * if the player is. Once a note is done it is drawn solid if it was hit and
 * hollow if it was missed, and the same result fills in the strip under the lane.
 */

type Phase = "idle" | "starting" | "countin" | "playing" | "done";

type Readout = {
  bar: number;
  target: string | null; // the note to play now, as written in the score
  heard: NoteReading | null; // the note the mic hears
  onPitch: boolean;
  offBy: number | null; // semitones above (+) or below (-) the target, ignoring octaves
  score: number; // the score so far, out of 100
};

const EMPTY_READOUT: Readout = { bar: 1, target: null, heard: null, onPitch: false, offBy: null, score: 0 };

const GUTTER = 52; // px, the note-name column on the left of the lane
const TOP = 30; // px, room for bar numbers
const BOTTOM = 12;
const NOW_AT = 0.24; // the now line sits this far across the lane
const BEATS_ACROSS = 9; // how many beats fit across a wide lane
const MIN_PX_PER_BEAT = 64;
const TRAIL_BEATS = 6; // how much of the player's pitch trail is kept
const START_DELAY = 0.3; // seconds between pressing Start and the first click
const READOUT_MS = 100; // the text under the lane updates 10 times a second
const METRONOME_VOLUME = 0.6;
// What the mic reports is a little old by the time it arrives: the sound has
// to be captured and a 43 ms window analysed. Each reading is credited to the
// moment it was actually played, this long before it arrived.
const HEARING_DELAY = 0.06; // seconds

// Working out the player's octave: the octave most of their readings so far
// fall in. Pitch detectors sometimes report a low voice an octave too high for
// a moment, so one stray stretch should not move the lane.
const OCTAVE_MIN_READINGS = 15;

// Flat colors for the lane. The background comes from the theme's --deep.
const WHITE = "#ffffff";
const GRID = "rgb(255 255 255 / 0.06)";
const BEAT_LINE = "rgb(255 255 255 / 0.08)";
const BAR_LINE = "rgb(255 255 255 / 0.24)";

function noteAt(notes: PieceNote[], beat: number) {
  return notes.find((note) => beat >= note.beat && beat < note.beat + note.beats) ?? null;
}

// The note being played now, or failing that the next one, or the last one.
function nearestNote(notes: PieceNote[], beat: number) {
  return noteAt(notes, beat) ?? notes.find((note) => note.beat >= beat) ?? notes[notes.length - 1];
}

// The small line next to the note the player is making.
function describePitch({ heard, onPitch, offBy }: Readout) {
  if (!heard) return "";
  // Playing a different note from the one asked for: say which way to move.
  if (offBy !== null && !onPitch) return offBy > 0 ? "too high" : "too low";
  if (heard.cents === 0) return "in tune";
  return `${Math.abs(heard.cents)} cents ${heard.cents > 0 ? "sharp" : "flat"}`;
}

// One line saying which octave the lane is showing.
function describeOctave(octaves: number) {
  if (octaves === 0) return "Octave: as written";
  const count = Math.abs(octaves) === 1 ? "1 octave" : `${Math.abs(octaves)} octaves`;
  return `Octave: ${count} ${octaves > 0 ? "above" : "below"} the written notes`;
}

function formatLength(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

export default function PlayScreen({ piece }: { piece: Piece }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [readout, setReadout] = useState<Readout>(EMPTY_READOUT);
  const [metronomeOn, setMetronomeOn] = useState(true);
  const [grades, setGrades] = useState<Array<NoteGrade | null>>(() => piece.notes.map(() => null));
  const [result, setResult] = useState<RunResult | null>(null);
  // How many octaves above (+) or below (-) the written piece the player is.
  const [octave, setOctave] = useState(0);
  const octaveRef = useRef(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // The same grades as the state above, readable from inside the drawing code.
  const gradesRef = useRef<Array<NoteGrade | null>>(piece.notes.map(() => null));
  const phaseRef = useRef<Phase>("idle");
  const metronomeOnRef = useRef(true);
  const setMetronomeVolume = useRef<((volume: number) => void) | null>(null);
  const stopMic = useRef<() => void>(() => {});

  // The run in progress: when it started on the audio clock, and the pitch trail.
  const run = useRef<{
    startTime: number;
    trail: Array<{ beat: number; midi: number | null }>;
    lastReadout: number;
    scorer: ReturnType<typeof createScorer>;
    octaveCounts: Map<number, number>; // readings seen in each octave, relative to the written piece
    octaveReadings: number;
  } | null>(null);
  // The note being listened for, so the drawing code can light it up.
  const listeningForRef = useRef(-1);
  // What was last drawn, so the lane can be redrawn when the window is resized.
  const lastDrawn = useRef<{ beat: number; live: number | null; onPitch: boolean; trail: Array<{ beat: number; midi: number | null }> }>(
    { beat: 0, live: null, onPitch: false, trail: [] },
  );

  const secondsPerBeat = beatsToSeconds(piece, 1);
  const firstNoteBeat = piece.notes[0]?.beat ?? 0;
  const lowest = Math.min(...piece.notes.map((note) => note.midi)) - 2;
  const highest = Math.max(...piece.notes.map((note) => note.midi)) + 2;

  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const draw = useCallback(
    (beat: number, live: number | null, onPitch: boolean, trail: Array<{ beat: number; midi: number | null }>) => {
      lastDrawn.current = { beat, live, onPitch, trail };

      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const styles = getComputedStyle(canvas);
      const deep = styles.getPropertyValue("--deep").trim() || "#1c0c36";
      const noteColor = styles.getPropertyValue("--deep-accent").trim() || "#dcbde2";
      const labelColor = styles.getPropertyValue("--deep-muted").trim() || "#b9aecb";
      const font = styles.fontFamily; // the label typeface, set on the canvas
      const displayFont = styles.getPropertyValue("--type-display").trim() || font;

      // Positions are worked out at the written pitch; only the names shown
      // move with the player's octave.
      const octaves = octaveRef.current;
      const rows = highest - lowest + 1;
      const rowHeight = (height - TOP - BOTTOM) / rows;
      const pxPerBeat = Math.max(MIN_PX_PER_BEAT, (width - GUTTER) / BEATS_ACROSS);
      const nowX = GUTTER + (width - GUTTER) * NOW_AT;
      const xOf = (atBeat: number) => nowX + (atBeat - beat) * pxPerBeat;
      const yOf = (midi: number) => TOP + (highest - midi) * rowHeight + rowHeight / 2;
      const countingIn = beat < firstNoteBeat;

      context.fillStyle = deep;
      context.fillRect(0, 0, width, height);

      // One faint line under each pitch row.
      context.strokeStyle = GRID;
      context.lineWidth = 1;
      for (let row = 0; row <= rows; row++) {
        const y = Math.round(TOP + row * rowHeight) + 0.5;
        context.beginPath();
        context.moveTo(GUTTER, y);
        context.lineTo(width, y);
        context.stroke();
      }

      // Beat lines, with a stronger line and a number at the start of each bar.
      const firstVisible = Math.max(0, Math.floor(beat - (nowX - GUTTER) / pxPerBeat));
      const lastVisible = Math.min(piece.totalBeats, Math.ceil(beat + (width - nowX) / pxPerBeat));
      context.font = `600 11px ${font}`;
      context.textBaseline = "middle";
      context.textAlign = "left";
      for (let b = firstVisible; b <= lastVisible; b++) {
        const x = Math.round(xOf(b)) + 0.5;
        const barStart = b % piece.beatsPerBar === 0;
        context.strokeStyle = barStart ? BAR_LINE : BEAT_LINE;
        context.beginPath();
        context.moveTo(x, barStart ? 0 : TOP);
        context.lineTo(x, height);
        context.stroke();
        if (barStart && b < piece.totalBeats) {
          context.fillStyle = labelColor;
          context.fillText(String(b / piece.beatsPerBar + 1), x + 6, TOP / 2);
        }
      }

      // The notes.
      const noteHeight = Math.max(8, rowHeight - 4);
      context.textAlign = "center";
      context.font = `700 ${Math.min(13, noteHeight - 2)}px ${font}`;
      for (const [index, note] of piece.notes.entries()) {
        const x = xOf(note.beat) + 2;
        const noteWidth = note.beats * pxPerBeat - 4;
        if (x > width || x + noteWidth < GUTTER) continue;

        const playing = index === listeningForRef.current;
        const missed = gradesRef.current[index] === "miss";
        const labelled = noteHeight >= 12 && noteWidth >= 34;
        const y = yOf(note.midi);
        context.globalAlpha = countingIn ? 0.55 : 1;
        context.beginPath();

        if (missed) {
          // A missed note is left hollow.
          context.globalAlpha = 0.6;
          context.roundRect(x + 0.75, y - noteHeight / 2 + 0.75, noteWidth - 1.5, noteHeight - 1.5, 3);
          context.lineWidth = 1.5;
          context.strokeStyle = noteColor;
          context.stroke();
          if (labelled) {
            context.fillStyle = noteColor;
            context.fillText(prettyNoteName(shiftOctave(note.name, octaves)), x + noteWidth / 2, y + 0.5);
          }
          continue;
        }

        // Upcoming notes and hit notes are solid; the one being played is white.
        context.fillStyle = playing ? WHITE : noteColor;
        context.roundRect(x, y - noteHeight / 2, noteWidth, noteHeight, 3);
        context.fill();
        if (labelled) {
          context.fillStyle = deep;
          context.fillText(prettyNoteName(shiftOctave(note.name, octaves)), x + noteWidth / 2, y + 0.5);
        }
      }
      context.globalAlpha = 1;

      // The player's pitch over the last few beats.
      context.strokeStyle = WHITE;
      context.lineWidth = 2.5;
      context.lineJoin = "round";
      context.lineCap = "round";
      context.beginPath();
      let penDown = false;
      for (const sample of trail) {
        const x = xOf(sample.beat);
        if (sample.midi === null || x < GUTTER) {
          penDown = false;
          continue;
        }
        const y = yOf(Math.min(highest, Math.max(lowest, sample.midi)));
        if (penDown) context.lineTo(x, y);
        else context.moveTo(x, y);
        penDown = true;
      }
      context.stroke();

      // The now line.
      context.fillStyle = WHITE;
      context.fillRect(Math.round(nowX) - 1, 0, 2, height);

      // The player's pitch right now: solid when on the note, a ring when off it.
      if (live !== null) {
        const y = yOf(Math.min(highest, Math.max(lowest, live)));
        context.beginPath();
        context.arc(nowX, y, 8, 0, Math.PI * 2);
        context.fillStyle = onPitch ? WHITE : deep;
        context.fill();
        context.lineWidth = 3;
        context.strokeStyle = WHITE;
        context.stroke();
      }

      // The note-name column, drawn last so notes slide underneath it.
      context.fillStyle = deep;
      context.fillRect(0, 0, GUTTER, height);
      context.fillStyle = labelColor;
      context.textAlign = "right";
      context.font = `500 ${Math.min(11, Math.max(9, rowHeight - 4))}px ${font}`;
      for (let midi = lowest; midi <= highest; midi++) {
        context.fillText(midiName(midi + octaves * 12), GUTTER - 10, yOf(midi) + 0.5);
      }

      // The count-in, large in the empty space behind the now line (nothing has
      // been played yet). On a narrow screen that space is too small, so it
      // sits ahead of the line instead.
      if (countingIn && beat >= 0 && phaseRef.current === "countin") {
        const behind = nowX - GUTTER;
        const centerX = behind >= 160 ? GUTTER + behind / 2 : nowX + (width - nowX) / 2;
        context.fillStyle = WHITE;
        context.textAlign = "center";
        context.font = `800 ${Math.min(140, height * 0.42)}px ${displayFont}`;
        context.fillText(String(Math.floor(beat) + 1), centerX, TOP + (height - TOP) / 2);
      }
    },
    [piece, lowest, highest, firstNoteBeat],
  );

  const onFrame = useCallback(
    (frame: MicFrame) => {
      const current = run.current;
      if (!current) return;

      const beat = (frame.time - current.startTime) / secondsPerBeat;
      // The moment this reading was actually played.
      const heardBeat = beat - HEARING_DELAY / secondsPerBeat;

      if (beat >= piece.totalBeats) {
        run.current = null;
        stopMic.current();
        const final = current.scorer.finish();
        gradesRef.current = final.grades;
        listeningForRef.current = -1;
        setGrades(final.grades);
        setResult(final);
        changePhase("done");
        setReadout({ ...EMPTY_READOUT, bar: piece.bars, score: final.score });
        draw(piece.totalBeats, null, false, current.trail);
        return;
      }

      // Hand the reading to the scorer, which says which note it is listening
      // for at this moment and whether the reading matched it.
      const reading = current.scorer.read(heardBeat * secondsPerBeat, frame.hertz);
      listeningForRef.current = reading.listeningFor;
      const sounding = reading.listeningFor === -1 ? null : piece.notes[reading.listeningFor];

      // Pick up any notes the scorer has just finished grading.
      if (current.scorer.grades.some((result, index) => result !== gradesRef.current[index])) {
        gradesRef.current = [...current.scorer.grades];
        setGrades(gradesRef.current);
      }

      // Which octave is the player in? The one most of their readings so far fall in.
      if (sounding && frame.hertz) {
        const heardOctave = Math.round((hertzToMidi(frame.hertz) - sounding.midi) / 12);
        current.octaveCounts.set(heardOctave, (current.octaveCounts.get(heardOctave) ?? 0) + 1);
        current.octaveReadings++;
        if (current.octaveReadings >= OCTAVE_MIN_READINGS) {
          const [commonest] = [...current.octaveCounts].sort((a, b) => b[1] - a[1])[0];
          if (commonest !== octaveRef.current) {
            octaveRef.current = commonest;
            setOctave(commonest);
          }
        }
      }

      // Where to draw the player's pitch: in whichever octave is nearest the notes.
      const nearest = sounding ?? nearestNote(piece.notes, heardBeat - current.scorer.lag() / secondsPerBeat);
      const live = frame.hertz ? foldToward(hertzToMidi(frame.hertz), nearest.midi) : null;

      current.trail.push({ beat: heardBeat, midi: live });
      while (current.trail.length && current.trail[0].beat < beat - TRAIL_BEATS) current.trail.shift();

      const nextPhase: Phase = beat < firstNoteBeat ? "countin" : "playing";
      if (phaseRef.current !== nextPhase) changePhase(nextPhase);

      draw(beat, live, reading.onPitch, current.trail);

      const now = performance.now();
      if (now - current.lastReadout >= READOUT_MS) {
        current.lastReadout = now;
        setReadout({
          bar: Math.min(piece.bars, Math.floor(Math.max(0, beat) / piece.beatsPerBar) + 1),
          target: sounding ? prettyNoteName(shiftOctave(sounding.name, octaveRef.current)) : null,
          // Shown in the player's own octave, so a momentary octave slip by
          // the pitch detector doesn't make the note name jump about.
          heard: live !== null ? readNote(midiToHertz(live + octaveRef.current * 12)) : null,
          onPitch: reading.onPitch,
          offBy: reading.offBy,
          score: current.scorer.score(),
        });
      }
    },
    [piece, secondsPerBeat, firstNoteBeat, draw, changePhase],
  );

  const mic = useMic(onFrame);

  useEffect(() => {
    stopMic.current = mic.stop;
  }, [mic.stop]);

  // Draw the lane before anything starts, and again whenever its size changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const redraw = () => {
      const last = lastDrawn.current;
      draw(last.beat, last.live, last.onPitch, last.trail);
    };
    redraw();
    const observer = new ResizeObserver(redraw);
    observer.observe(canvas);
    // The note labels use the page font, which may finish loading after the first draw.
    void document.fonts?.ready.then(redraw);
    return () => observer.disconnect();
  }, [draw]);

  const clearScore = () => {
    gradesRef.current = piece.notes.map(() => null);
    listeningForRef.current = -1;
    setGrades(gradesRef.current);
    setResult(null);
    setReadout(EMPTY_READOUT);
  };

  const start = async () => {
    changePhase("starting");
    clearScore();
    draw(0, null, false, []);

    const context = await mic.start();
    if (!context) {
      changePhase("idle");
      return;
    }

    const startTime = context.currentTime + START_DELAY;
    setMetronomeVolume.current = scheduleMetronome(context, {
      startTime,
      beats: piece.totalBeats,
      beatsPerBar: piece.beatsPerBar,
      secondsPerBeat,
      volume: metronomeOnRef.current ? METRONOME_VOLUME : 0,
    });
    run.current = {
      startTime,
      trail: [],
      lastReadout: 0,
      scorer: createScorer(piece),
      octaveCounts: new Map(),
      octaveReadings: 0,
    };
    changePhase("countin");
  };

  const stop = () => {
    run.current = null;
    mic.stop();
    changePhase("idle");
    clearScore();
    draw(0, null, false, []);
  };

  const toggleMetronome = (on: boolean) => {
    metronomeOnRef.current = on;
    setMetronomeOn(on);
    setMetronomeVolume.current?.(on ? METRONOME_VOLUME : 0);
  };

  const running = phase === "countin" || phase === "playing";

  // The notes grouped into their bars, for the strip under the lane.
  const barsWithNotes: Array<{ number: number; noteIndexes: number[] }> = [];
  piece.notes.forEach((note, index) => {
    const last = barsWithNotes[barsWithNotes.length - 1];
    if (last?.number === note.bar) last.noteIndexes.push(index);
    else barsWithNotes.push({ number: note.bar, noteIndexes: [index] });
  });
  const heard = readout.heard;

  return (
    <Container className="flex flex-1 flex-col gap-6 py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div className="flex flex-col gap-4">
          <Headline as="h1">{piece.title}</Headline>
        </div>
        <dl className="flex gap-8 text-sm">
          {[
            ["Tempo", `${piece.bpm} bpm`],
            ["Time", `${piece.beatsPerBar}/4`],
            ["Length", formatLength(beatsToSeconds(piece, piece.totalBeats))],
          ].map(([term, value]) => (
            <div key={term}>
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{term}</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <div className="relative overflow-hidden rounded-t-md bg-deep">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`${piece.title}: the notes scroll toward a line, and a dot shows the pitch you are playing.`}
            className="block h-80 w-full font-label sm:h-[26rem]"
          />

          {!running && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-deep/90 px-6 text-center text-on-deep">
              {phase === "done" && result ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-deep-accent">Your score</p>
                  <p className="-my-2 font-display text-8xl font-extrabold leading-none tabular-nums sm:text-9xl">{result.score}</p>
                  <div className="text-on-deep/85">
                    <p className="text-lg">
                      {result.hits} of {result.notes} notes on pitch
                    </p>
                    <p className="mt-1">{describeTiming(result.lag)}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap justify-center gap-3">
                    <Button variant="light" onClick={start}>
                      Play again
                    </Button>
                    <ButtonLink href="/play" variant="outline-on-deep">
                      Sound check
                    </ButtonLink>
                  </div>
                </>
              ) : (
                <>
                  <Button variant="light" onClick={start} disabled={phase === "starting"} className="disabled:opacity-60">
                    {phase === "starting" ? "Starting…" : "Start"}
                  </Button>
                  <p className="max-w-sm text-on-deep/85">
                    You get four clicks, then play each note as it reaches the white line.
                  </p>
                </>
              )}
              {mic.error && (
                <p role="alert" className="max-w-md rounded-[3px] bg-surface px-4 py-3 text-sm font-medium text-accent">
                  {mic.error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* One mark per note, grouped by bar: solid when hit, hollow when missed. */}
        <ol
          aria-label={`Notes, bar by bar. ${grades.filter((result) => result === "hit").length} hit so far.`}
          className="flex gap-2 rounded-b-md border border-t-0 border-line bg-surface px-3 py-3 sm:gap-3 sm:px-4"
        >
          {barsWithNotes.map((bar) => (
            <li key={bar.number} className="flex flex-1 gap-0.5 sm:gap-1">
              {bar.noteIndexes.map((index) => (
                <span
                  key={index}
                  className={cx(
                    "h-2.5 flex-1 rounded-[2px]",
                    grades[index] === "hit" && "bg-accent",
                    grades[index] === "miss" && "border border-accent/60",
                    grades[index] === null && "bg-line",
                  )}
                />
              ))}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4">
        <ReadoutCell label="Play">
          <span className="font-display text-5xl font-extrabold leading-none text-accent">{readout.target ?? "–"}</span>
        </ReadoutCell>
        <ReadoutCell label="You">
          <span className={cx("font-display text-5xl font-extrabold leading-none", readout.onPitch ? "text-accent" : "text-ink")}>
            {heard ? `${heard.name}${heard.octave}` : "–"}
          </span>
          {heard && <span className="text-muted">{describePitch(readout)}</span>}
        </ReadoutCell>
        <ReadoutCell label="Bar">
          <span className="font-display text-5xl font-extrabold leading-none tabular-nums">{readout.bar}</span>
          <span className="text-muted">of {piece.bars}</span>
        </ReadoutCell>
        <ReadoutCell label="Score">
          <span className="font-display text-5xl font-extrabold leading-none tabular-nums text-accent">{readout.score}</span>
          <span className="text-muted">of 100</span>
        </ReadoutCell>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em]">
            <input
              type="checkbox"
              checked={metronomeOn}
              onChange={(event) => toggleMetronome(event.target.checked)}
              className="size-5 accent-(--accent)"
            />
            Metronome
          </label>
          <p className="text-muted">{describeOctave(octave)}</p>
        </div>
        {running && (
          <Button variant="outline" size="md" onClick={stop}>
            Stop
          </Button>
        )}
      </div>
    </Container>
  );
}

function ReadoutCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 bg-surface p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="flex min-h-12 flex-wrap items-baseline gap-x-3 gap-y-1">{children}</p>
    </div>
  );
}
