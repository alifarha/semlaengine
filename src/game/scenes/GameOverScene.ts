import { Scene, type EngineContext, type Renderer } from "@engine";
import { GameScene } from "./GameScene";

export interface RunSummary {
  level: number;
  kills: number;
  time: number;
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

  render(renderer: Renderer, _alpha: number): void {
    const ctx = renderer.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
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

    ctx.fillStyle = "#9b9bb5";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Press Space or click to play again", cx, renderer.height / 2 + 90);

    // Use held-state (not edge) here: per-frame "pressed" flags are cleared
    // during the update phase, before render runs.
    if (this.ctx.input.isDown("Space") || this.ctx.input.pointerDown) {
      this.ctx.scenes.change(new GameScene(this.ctx));
    }
  }
}
