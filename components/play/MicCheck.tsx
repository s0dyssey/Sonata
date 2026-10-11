"use client";

import { useCallback, useRef, useState } from "react";
import { readNote, type NoteReading } from "@/lib/audio/notes";
import { SILENCE_RMS, useMic, type MicFrame } from "@/lib/audio/use-mic";
import { Button, ButtonLink, cx } from "../ui";

const NOTE_REFRESH_MS = 100; // the meter moves every frame; the note text 10 times a second

/* The sound check: turn the mic on, pick an input, and watch three checks
   tick off as SONATA hears you. */
export default function MicCheck({ playHref }: { playHref: string }) {
  const [note, setNote] = useState<NoteReading | null>(null);
  const [heardSound, setHeardSound] = useState(false);
  const [heardNote, setHeardNote] = useState(false);

  const meterRef = useRef<HTMLDivElement | null>(null);
  const lastNoteUpdate = useRef(0);

  const onFrame = useCallback((frame: MicFrame) => {
    if (meterRef.current) meterRef.current.style.transform = `scaleX(${frame.level})`;

    const now = performance.now();
    if (now - lastNoteUpdate.current < NOTE_REFRESH_MS) return;
    lastNoteUpdate.current = now;

    setNote(frame.hertz ? readNote(frame.hertz) : null);
    if (frame.rms > SILENCE_RMS) setHeardSound(true);
    if (frame.hertz) setHeardNote(true);
  }, []);

  const mic = useMic(onFrame);
  const listening = mic.status === "listening";

  const reset = () => {
    if (meterRef.current) meterRef.current.style.transform = "scaleX(0)";
    setNote(null);
    setHeardSound(false);
    setHeardNote(false);
  };

  const turnOn = (deviceId?: string) => {
    reset();
    void mic.start(deviceId);
  };

  const turnOff = () => {
    mic.stop();
    reset();
  };

  const checks = [
    { label: "Microphone allowed", done: listening },
    { label: "Sound coming through", done: listening && heardSound },
    { label: "Note recognised", done: listening && heardNote },
  ];
  const ready = checks.every((check) => check.done);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section aria-label="Microphone" className="rounded-md border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-end gap-4">
          <Button
            variant={listening ? "outline" : "primary"}
            disabled={mic.status === "starting"}
            onClick={() => (listening ? turnOff() : turnOn(mic.deviceId || undefined))}
            className="disabled:opacity-60"
          >
            {mic.status === "starting" ? "Starting…" : listening ? "Turn off mic" : "Turn on mic"}
          </Button>

          {mic.devices.length > 0 && (
            <div className="min-w-0 flex-1 basis-56">
              <label htmlFor="input-device" className="block text-xs font-semibold uppercase tracking-[0.16em]">
                Input
              </label>
              <select
                id="input-device"
                value={mic.deviceId}
                onChange={(event) => turnOn(event.target.value)}
                className="mt-2 block h-14 w-full rounded-[3px] border border-line bg-surface px-3 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                {mic.devices.map((device, index) => (
                  <option key={device.deviceId || index} value={device.deviceId}>
                    {device.label || `Microphone ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {mic.error && (
          <p role="alert" className="mt-6 border-l-2 border-rule bg-tint px-4 py-3 text-sm font-medium text-accent">
            {mic.error}
          </p>
        )}

        <div className="mt-8">
          <p id="level-label" className="text-xs font-semibold uppercase tracking-[0.16em]">
            Level
          </p>
          <div aria-labelledby="level-label" className="mt-3 h-3 overflow-hidden rounded-[3px] bg-line">
            <div ref={meterRef} className="h-full origin-left bg-accent" style={{ transform: "scaleX(0)" }} />
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]">Note</p>
          {note ? (
            <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1">
              <p className="font-display text-7xl font-extrabold leading-none tabular-nums text-accent">
                {note.name}
                <span className="text-3xl font-medium text-muted">{note.octave}</span>
              </p>
              <p className="text-lg tabular-nums text-muted">
                {note.cents === 0 ? "in tune" : `${Math.abs(note.cents)} cents ${note.cents > 0 ? "sharp" : "flat"}`},{" "}
                {note.hertz.toFixed(1)} Hz
              </p>
            </div>
          ) : (
            <p className="mt-3 text-lg text-muted">
              {listening ? "Sing or play one held note." : "Turn on the mic, then sing or play one held note."}
            </p>
          )}
        </div>
      </section>

      <section aria-label="Checks" className="rounded-md border border-line bg-surface p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Checks</p>
        <ul className="mt-5 flex flex-col gap-4">
          {checks.map((check) => (
            <li key={check.label} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={cx(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border",
                  check.done ? "border-accent bg-accent text-on-accent" : "border-line text-transparent",
                )}
              >
                <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
                  <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className={check.done ? "text-ink" : "text-muted"}>
                {check.label}
                <span className="sr-only">{check.done ? ": done" : ": waiting"}</span>
              </span>
            </li>
          ))}
        </ul>
        <p role="status" className="mt-6 border-t border-line pt-5 text-lg font-semibold">
          {ready ? "You’re ready to play." : <span className="font-normal text-muted">Three checks to go green.</span>}
        </p>
        <ButtonLink href={playHref} variant={ready ? "primary" : "outline"} className="mt-6 w-full">
          Play the piece
        </ButtonLink>
      </section>
    </div>
  );
}
