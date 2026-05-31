/** Options for a single synthesized tone. */
export interface ToneOptions {
  /** Starting frequency in Hz. */
  freq: number;
  /** Optional end frequency for a pitch slide. */
  slideTo?: number;
  /** Duration in seconds. */
  duration?: number;
  /** Oscillator waveform. */
  type?: OscillatorType;
  /** Peak gain [0,1] before the master volume. */
  gain?: number;
}

/**
 * A tiny procedural sound engine built on the Web Audio API.
 *
 * It synthesizes short tones and noise bursts on the fly, so the game ships
 * with satisfying SFX and zero audio assets. (Swap in sample playback later by
 * decoding buffers through the same {@link AudioContext}.)
 *
 * Browsers block audio until a user gesture, so the context is created lazily
 * and {@link unlockOnGesture} resumes it on the first input.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  /** Master volume [0,1]. */
  volume = 0.35;
  /** Set false to mute everything. */
  enabled = true;

  /** Resume/create the audio context on the first pointer or key event. */
  unlockOnGesture(): void {
    const unlock = () => {
      this.ensureContext();
      this.ctx?.resume();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    // Guard for non-browser/test environments.
    const Ctor =
      typeof AudioContext !== "undefined"
        ? AudioContext
        : (globalThis as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    return this.ctx;
  }

  /** Play a short tone with a quick attack and exponential decay. */
  tone(opts: ToneOptions): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.master) return;
    this.master.gain.value = this.volume;

    const now = ctx.currentTime;
    const duration = opts.duration ?? 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = opts.type ?? "square";
    osc.frequency.setValueAtTime(opts.freq, now);
    if (opts.slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, opts.slideTo),
        now + duration,
      );
    }

    const peak = opts.gain ?? 0.3;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  /** Play a filtered noise burst — good for hits and explosions. */
  noise(duration = 0.18, gainPeak = 0.25, cutoff = 1800): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.master) return;
    this.master.gain.value = this.volume;

    const now = ctx.currentTime;
    const frames = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainPeak, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter).connect(gain).connect(this.master);
    src.start(now);
    src.stop(now + duration);
  }
}
