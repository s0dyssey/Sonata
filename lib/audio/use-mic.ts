"use client";

import { PitchDetector } from "pitchy";
import { useCallback, useEffect, useRef, useState } from "react";

const BUFFER_SIZE = 2048; // samples analysed per frame, about 43 ms of sound

// Below this the room counts as silent, so background hiss isn't read as a note.
export const SILENCE_RMS = 0.01;
// pitchy's confidence, 0 to 1, that it found one clear pitch.
const MIN_CLARITY = 0.9;

export type MicStatus = "idle" | "starting" | "listening";

/* What the mic heard in one animation frame (about 60 a second). */
export type MicFrame = {
  rms: number; // raw loudness, 0 to 1
  level: number; // loudness mapped for a meter, 0 (silent) to 1 (very loud)
  hertz: number | null; // the pitch, or null when there is silence or no single clear note
  time: number; // seconds on the audio clock, for lining notes up with a metronome later
};

// The input picked on the sound check is remembered in this browser, so the
// play screen opens the same mic or mixer without asking again.
const INPUT_KEY = "sonata-input";

function rememberedInput() {
  try {
    return window.localStorage.getItem(INPUT_KEY) ?? undefined;
  } catch {
    return undefined; // storage can be blocked, e.g. in a private window
  }
}

function rememberInput(deviceId: string) {
  try {
    window.localStorage.setItem(INPUT_KEY, deviceId);
  } catch {
    // Not being able to remember it only means the default mic is used next time.
  }
}

function describeError(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError") {
    return "The browser blocked the microphone. Allow it from the icon in the address bar, then turn the mic on again.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "No microphone was found. Plug in your mic or mixer, then turn the mic on again.";
  }
  if (name === "NotReadableError") {
    return "Another app is using the microphone. Close it, then turn the mic on again.";
  }
  return "The microphone could not be started. Check that it is plugged in and try again.";
}

/*
 * Opens the microphone and calls onFrame with what it hears, every frame,
 * until stop() is called or the page is left.
 *
 *   const mic = useMic((frame) => { ...frame.level, frame.hertz... });
 *   mic.start();          // must be called from a click, browsers require it
 *   const context = await mic.start();  // the AudioContext, or null if the mic failed.
 *                                       // frame.time is on this context's clock.
 *   mic.start(deviceId);  // switch to another input
 *   mic.stop();
 */
export function useMic(onFrame: (frame: MicFrame) => void) {
  const [status, setStatus] = useState<MicStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");

  const contextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const onFrameRef = useRef(onFrame);

  // Always call the newest onFrame without restarting the mic.
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  const release = useCallback(() => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void contextRef.current?.close();
    contextRef.current = null;
  }, []);

  const stop = useCallback(() => {
    release();
    setStatus("idle");
  }, [release]);

  const refreshDevices = useCallback(async () => {
    const all = await navigator.mediaDevices.enumerateDevices();
    setDevices(all.filter((device) => device.kind === "audioinput"));
  }, []);

  const start = useCallback(
    async (requestedDeviceId?: string): Promise<AudioContext | null> => {
      release();
      setError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("idle");
        setError("This browser can’t use the microphone here. Open the site on https or on localhost.");
        return null;
      }

      setStatus("starting");
      try {
        const open = (id?: string) =>
          navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: id ? { exact: id } : undefined,
              // These are built for speech on calls. They bend and gate the
              // sound of an instrument, so switch them off.
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
          });

        // With no input asked for, try the one remembered from last time, and
        // fall back to the default mic if it has been unplugged since.
        const remembered = requestedDeviceId ? undefined : rememberedInput();
        const stream = remembered ? await open(remembered).catch(() => open()) : await open(requestedDeviceId);
        streamRef.current = stream;

        const context = new AudioContext();
        contextRef.current = context;
        await context.resume();

        const analyser = context.createAnalyser();
        analyser.fftSize = BUFFER_SIZE;
        // Analyse only. Nothing is sent to the speakers, so there is no feedback.
        context.createMediaStreamSource(stream).connect(analyser);

        // Input names can only be read once the mic is allowed.
        await refreshDevices();
        const activeDeviceId = stream.getAudioTracks()[0]?.getSettings().deviceId ?? requestedDeviceId ?? "";
        setDeviceId(activeDeviceId);
        if (activeDeviceId) rememberInput(activeDeviceId);

        const detector = PitchDetector.forFloat32Array(BUFFER_SIZE);
        const samples = new Float32Array(BUFFER_SIZE);

        const tick = () => {
          analyser.getFloatTimeDomainData(samples);

          let sumOfSquares = 0;
          for (let i = 0; i < samples.length; i++) sumOfSquares += samples[i] * samples[i];
          const rms = Math.sqrt(sumOfSquares / samples.length);

          // Map roughly -60 dB..0 dB onto 0..1.
          const decibels = 20 * Math.log10(Math.max(rms, 1e-6));
          const level = Math.min(1, Math.max(0, (decibels + 60) / 60));

          const [pitch, clarity] = detector.findPitch(samples, context.sampleRate);
          const clear = rms > SILENCE_RMS && clarity > MIN_CLARITY && pitch > 40 && pitch < 5000;

          onFrameRef.current({ rms, level, hertz: clear ? pitch : null, time: context.currentTime });
          animationRef.current = requestAnimationFrame(tick);
        };
        animationRef.current = requestAnimationFrame(tick);
        setStatus("listening");
        return context;
      } catch (caught) {
        release();
        setStatus("idle");
        setError(describeError(caught));
        return null;
      }
    },
    [refreshDevices, release],
  );

  // Let go of the mic when the player leaves the page.
  useEffect(() => release, [release]);

  // Keep the input list current when a mic or mixer is plugged in or removed.
  useEffect(() => {
    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices) return;
    const onChange = () => void refreshDevices();
    mediaDevices.addEventListener("devicechange", onChange);
    return () => mediaDevices.removeEventListener("devicechange", onChange);
  }, [refreshDevices]);

  return { status, error, devices, deviceId, start, stop };
}
