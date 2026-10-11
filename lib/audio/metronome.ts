/*
 * Schedules one click per beat on the audio clock, so the clicks and the
 * mic's frame.time agree on what time it is.
 *
 * The click is a short burst of noise rather than a beep: noise has no pitch,
 * so if the mic picks it up the pitch detector ignores it.
 *
 * Returns a function that sets the volume (0 mutes). The clicks stop on their
 * own when the audio context is closed, which useMic does on stop().
 */
export function scheduleMetronome(
  context: AudioContext,
  options: { startTime: number; beats: number; beatsPerBar: number; secondsPerBeat: number; volume: number },
) {
  const output = context.createGain();
  output.gain.value = options.volume;
  output.connect(context.destination);

  // 30 ms of fading noise, made once and reused for every click.
  const length = Math.floor(context.sampleRate * 0.03);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2;

  for (let beat = 0; beat < options.beats; beat++) {
    const downbeat = beat % options.beatsPerBar === 0;

    const click = context.createBufferSource();
    click.buffer = buffer;

    // Brighter and louder on the first beat of each bar.
    const tone = context.createBiquadFilter();
    tone.type = "bandpass";
    tone.frequency.value = downbeat ? 2400 : 1500;

    const accent = context.createGain();
    accent.gain.value = downbeat ? 1 : 0.55;

    click.connect(tone).connect(accent).connect(output);
    click.start(options.startTime + beat * options.secondsPerBeat);
  }

  return (volume: number) => {
    output.gain.value = volume;
  };
}
