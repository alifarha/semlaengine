/**
 * Procedurally drawn sprite sheet for sál orbs — a pulsing rune-lit mote,
 * 6 frames of 16×16 px in a single row. Generated on a canvas at startup so
 * the demo exercises the engine's image-sprite + Animator path with zero
 * shipped asset files. Returns null in headless environments (tests), where
 * gems fall back to their shape sprite.
 */
const FRAME = 16;
const FRAMES = 6;

let cached: HTMLCanvasElement | null | undefined;

export const GEM_SHEET = { frameSize: FRAME, frameCount: FRAMES };

export function gemSheet(): HTMLCanvasElement | null {
  if (cached !== undefined) return cached;
  if (typeof document === "undefined") return (cached = null);

  const canvas = document.createElement("canvas");
  canvas.width = FRAME * FRAMES;
  canvas.height = FRAME;
  const ctx = canvas.getContext("2d");
  if (!ctx) return (cached = null);

  for (let i = 0; i < FRAMES; i++) {
    const cx = i * FRAME + FRAME / 2;
    const cy = FRAME / 2;
    // Pulse: a sine over the loop so frame 5 leads back into frame 0.
    const pulse = 0.5 + 0.5 * Math.sin((i / FRAMES) * Math.PI * 2);

    // Outer glow.
    const glowR = 5 + pulse * 2.5;
    const glow = ctx.createRadialGradient(cx, cy, 1, cx, cy, glowR);
    glow.addColorStop(0, "rgba(70, 224, 160, 0.9)");
    glow.addColorStop(1, "rgba(70, 224, 160, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Core mote.
    ctx.fillStyle = "#bdf5dd";
    ctx.beginPath();
    ctx.arc(cx, cy, 1.6 + pulse * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  return (cached = canvas);
}
