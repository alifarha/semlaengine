import { Scene, type EngineContext, type Renderer, type Time } from "@engine";
import { GameScene } from "./GameScene";

export interface RunSummary {
  level: number;
  kills: number;
  time: number;
  /** Sál shards banked for meta-progression (see meta.ts). */
  shards: number;
}

/** Shows the results of a run and waits for a key to restart. */
export class GameOverScene extends Scene {
  constructor(
    ctx: EngineContext,
    private readonly summary: RunSummary,
  ) {
    super(ctx);
  }

  onEnter(): void {
    // No systems — this scene is a static screen.
  }

  override update(time: Time): void {
    super.update(time);
    // Edge-triggered so a button still held from the death frame doesn't skip
    // the results screen — the player must press again to restart.
    if (this.ctx.input.wasPressed("Space") || this.ctx.input.wasPointerPressed()) {
      this.ctx.scenes.change(new GameScene(this.ctx));
    }
  }

  render(renderer: Renderer, _alpha: number): void {
    const ctx = renderer.ctx;
    renderer.resetTransform();
    ctx.fillStyle = "#0b0b12";
    ctx.fillRect(0, 0, renderer.width, renderer.height);

    const cx = renderer.width / 2;
    ctx.textAlign = "center";

    ctx.fillStyle = "#ff5470";
    ctx.font = "bold 42px system-ui, sans-serif";
    ctx.fillText("You Died", cx, renderer.height / 2 - 70);

    const m = Math.floor(this.summary.time / 60);
    const s = Math.floor(this.summary.time % 60)
      .toString()
      .padStart(2, "0");

    ctx.fillStyle = "#e8e8f0";
    ctx.font = "20px system-ui, sans-serif";
    ctx.fillText(`Survived ${m}:${s}`, cx, renderer.height / 2 - 16);
    ctx.fillText(`Level ${this.summary.level}`, cx, renderer.height / 2 + 12);
    ctx.fillText(`${this.summary.kills} kills`, cx, renderer.height / 2 + 40);

    ctx.fillStyle = "#46e0a0";
    ctx.font = "18px Georgia, serif";
    ctx.fillText(`✦ +${this.summary.shards} sál shards for the Barrow`, cx, renderer.height / 2 + 72);

    ctx.fillStyle = "#9b9bb5";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Press Space or click to play again", cx, renderer.height / 2 + 104);
  }
}
