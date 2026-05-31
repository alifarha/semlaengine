import type { Renderer, InputManager } from "@engine";
import type { Rune } from "../data/runes";

interface CardRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const CARD_W = 244;
const CARD_H = 332;
const GAP = 22;

// DRAUGR palette (see the design document).
const COL = {
  dim: "rgba(8,6,4,0.82)",
  card: "#14100a",
  cardHover: "#1d1810",
  gold: "#b8922a",
  goldLight: "#d4af6a",
  parchment: "#f0e8d8",
  muted: "#9b8f76",
  blood: "#8b1a1a",
  glyph: "#d4af6a",
};

/**
 * The level-up Kenning choice — drawn in screen space over a frozen world.
 *
 * Three carved rune-stone tablets offer a rune each; the player picks with the
 * 1/2/3 keys or by clicking. This is the genre's signature meta-decision, and
 * the scene keeps the simulation paused while it's open.
 */
export class KenningScreen {
  private prevPointerDown = true; // require a fresh press to select

  /** Reset edge state when a new offer opens. */
  begin(): void {
    this.prevPointerDown = true;
  }

  /**
   * Returns the chosen option index (0..n-1) this step, or null. Edge-detected,
   * so call exactly once per update.
   */
  poll(options: readonly Rune[], input: InputManager, renderer: Renderer): number | null {
    // Keyboard: Digit1..DigitN.
    for (let i = 0; i < options.length; i++) {
      if (input.wasPressed(`Digit${i + 1}`)) return i;
    }

    // Pointer: rising edge inside a card.
    const down = input.pointerDown;
    const pressed = down && !this.prevPointerDown;
    this.prevPointerDown = down;
    if (pressed) {
      const [px, py] = this.pointerInCanvas(input, renderer);
      const rects = this.layout(renderer, options.length);
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
      }
    }
    return null;
  }

  render(options: readonly Rune[], input: InputManager, renderer: Renderer): void {
    const ctx = renderer.ctx;
    const { width, height } = renderer;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = COL.dim;
    ctx.fillRect(0, 0, width, height);

    // Heading.
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COL.goldLight;
    ctx.font = "bold 30px Georgia, 'Times New Roman', serif";
    ctx.fillText("CHOOSE A KENNING", width / 2, 70);
    ctx.fillStyle = COL.muted;
    ctx.font = "italic 14px Georgia, serif";
    ctx.fillText("A rune calls from the barrow. The draugr cannot tarry long.", width / 2, 94);

    const [hx, hy] = this.pointerInCanvas(input, renderer);
    const rects = this.layout(renderer, options.length);
    for (let i = 0; i < rects.length; i++) {
      const hovered =
        hx >= rects[i].x &&
        hx <= rects[i].x + rects[i].w &&
        hy >= rects[i].y &&
        hy <= rects[i].y + rects[i].h;
      this.drawCard(ctx, rects[i], options[i], i, hovered);
    }
  }

  private drawCard(
    ctx: CanvasRenderingContext2D,
    r: CardRect,
    rune: Rune,
    index: number,
    hovered: boolean,
  ): void {
    const lift = hovered ? 6 : 0;
    const x = r.x;
    const y = r.y - lift;

    // Tablet body + border.
    ctx.fillStyle = hovered ? COL.cardHover : COL.card;
    ctx.fillRect(x, y, r.w, r.h);
    ctx.lineWidth = hovered ? 3 : 1.5;
    ctx.strokeStyle = hovered ? COL.goldLight : COL.gold;
    ctx.strokeRect(x + 0.5, y + 0.5, r.w - 1, r.h - 1);

    ctx.textAlign = "center";

    // Rune glyph.
    ctx.fillStyle = COL.glyph;
    ctx.font = "72px Georgia, serif";
    ctx.fillText(rune.glyph, x + r.w / 2, y + 96);

    // Divider.
    ctx.strokeStyle = COL.gold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 40, y + 116);
    ctx.lineTo(x + r.w - 40, y + 116);
    ctx.stroke();

    // Name.
    ctx.fillStyle = COL.goldLight;
    ctx.font = "bold 20px Georgia, serif";
    ctx.fillText(rune.name, x + r.w / 2, y + 146);

    // Mechanical description (wrapped).
    ctx.fillStyle = COL.parchment;
    ctx.font = "14px Georgia, serif";
    let ty = y + 176;
    for (const line of wrap(ctx, rune.description, r.w - 36)) {
      ctx.fillText(line, x + r.w / 2, ty);
      ty += 19;
    }

    // Flavour (wrapped, italic).
    ctx.fillStyle = COL.muted;
    ctx.font = "italic 13px Georgia, serif";
    ty = y + r.h - 78;
    for (const line of wrap(ctx, `“${rune.flavor}”`, r.w - 36)) {
      ctx.fillText(line, x + r.w / 2, ty);
      ty += 18;
    }

    // Key hint badge.
    const badge = `${index + 1}`;
    ctx.fillStyle = COL.blood;
    ctx.fillRect(x + r.w / 2 - 14, y + r.h - 34, 28, 24);
    ctx.fillStyle = COL.parchment;
    ctx.font = "bold 15px Georgia, serif";
    ctx.fillText(badge, x + r.w / 2, y + r.h - 16);
  }

  private layout(renderer: Renderer, count: number): CardRect[] {
    const total = count * CARD_W + (count - 1) * GAP;
    const startX = (renderer.width - total) / 2;
    const y = (renderer.height - CARD_H) / 2 + 16;
    const rects: CardRect[] = [];
    for (let i = 0; i < count; i++) {
      rects.push({ x: startX + i * (CARD_W + GAP), y, w: CARD_W, h: CARD_H });
    }
    return rects;
  }

  /** Pointer position mapped from CSS pixels into canvas pixels. */
  private pointerInCanvas(input: InputManager, renderer: Renderer): [number, number] {
    const rect = renderer.canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? renderer.width / rect.width : 1;
    const scaleY = rect.height > 0 ? renderer.height / rect.height : 1;
    return [input.pointer.x * scaleX, input.pointer.y * scaleY];
  }
}

/** Greedy word-wrap to a pixel width using the current ctx font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}
