import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSound = create<{ enabled: boolean; toggle: () => void }>()(persist((set, get) => ({
  enabled: false,
  toggle: () => { set({ enabled: !get().enabled }); if (get().enabled) playSound("latch"); },
}), { name: "threadwise-sound" }));

export type SoundKind = "drop" | "drag" | "pan" | "accept" | "latch" | "complete" | "stamp";
let context: AudioContext | undefined;
const last: Partial<Record<SoundKind, number>> = {};
const THROTTLE: Partial<Record<SoundKind, number>> = { drag: 180, pan: 240 };

function noise(ctx: AudioContext, seconds: number, shape = 1) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let brown = 0;
  for (let i = 0; i < data.length; i++) {
    // Brown-ish noise gives heavy paper its dry, fibrous grain.
    brown = (brown + (Math.random() * 2 - 1) * 0.08) * 0.985;
    data[i] = (brown * 6 + (Math.random() * 2 - 1) * 0.25) * Math.pow(1 - i / data.length, shape);
  }
  const src = ctx.createBufferSource(); src.buffer = buffer; return src;
}

function tone(ctx: AudioContext, out: AudioNode, at: number, freq: number, peak: number, decay: number, type: OscillatorType = "sine", glideTo?: number) {
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, at);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, at + decay * 0.6);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  o.connect(g); g.connect(out); o.start(at); o.stop(at + decay + 0.02);
}

/** Synthesised desk foley. `x` (0–1 across the screen) places the sound in stereo space. */
export function playSound(kind: SoundKind, x = 0.5) {
  if (!useSound.getState().enabled || typeof window === "undefined") return;
  const t = Date.now(); const gap = THROTTLE[kind];
  if (gap && t - (last[kind] ?? 0) < gap) return;
  last[kind] = t;
  try {
    context ??= new AudioContext();
    void context.resume();
    const ctx = context; const now = ctx.currentTime;
    const master = ctx.createGain();
    const pan = ctx.createStereoPanner(); pan.pan.value = Math.max(-0.8, Math.min(0.8, (x - 0.5) * 1.6));
    master.connect(pan); pan.connect(ctx.destination);
    if (kind === "drag" || kind === "pan") {
      // Dry drag of heavy-weight paper: low band-passed grain with a slow swell.
      const src = noise(ctx, kind === "pan" ? 0.28 : 0.12, 0.6);
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = kind === "pan" ? 480 : 820; bp.Q.value = 0.7;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200;
      master.gain.setValueAtTime(0.0001, now);
      master.gain.linearRampToValueAtTime(kind === "pan" ? 0.05 : 0.04, now + 0.06);
      master.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "pan" ? 0.28 : 0.12));
      src.connect(bp); bp.connect(lp); lp.connect(master); src.start(now);
    } else if (kind === "drop") {
      const src = noise(ctx, 0.08, 2);
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1500;
      master.gain.value = 0.12; src.connect(bp); bp.connect(master); src.start(now);
      tone(ctx, master, now, 160, 0.05, 0.08, "sine", 90);
    } else if (kind === "latch") {
      // Brass click: inharmonic metallic partials over a tiny transient.
      const tick = noise(ctx, 0.012, 3); const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3000;
      master.gain.value = 1; tick.connect(hp); hp.connect(master); tick.start(now);
      for (const [f, a] of [[2380, 0.03], [3710, 0.018], [5260, 0.01]] as const) tone(ctx, master, now + 0.002, f, a, 0.11);
      tone(ctx, master, now + 0.045, 3120, 0.012, 0.07);
    } else if (kind === "stamp") {
      // Resonant mechanical stamp: low thud, felt impact, ringing desk body.
      tone(ctx, master, now, 120, 0.22, 0.22, "sine", 48);
      const hit = noise(ctx, 0.05, 2.5); const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
      const hg = ctx.createGain(); hg.gain.value = 0.35; hit.connect(lp); lp.connect(hg); hg.connect(master); hit.start(now);
      tone(ctx, master, now + 0.01, 220, 0.03, 0.9); tone(ctx, master, now + 0.01, 331, 0.015, 0.7);
      master.gain.value = 0.9;
    } else {
      const freqs = kind === "complete" ? [440, 660] : [920];
      master.gain.value = 1;
      freqs.forEach((f, i) => tone(ctx, master, now + i * 0.08, f, 0.025, 0.24));
    }
  } catch { /* Sound never interrupts editing. */ }
}
