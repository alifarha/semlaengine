import { Scene, type EngineContext, type Renderer } from "@engine";
import { GameScene } from "./GameScene";

/** Title screen. Press any movement key or click to start. */
export class MenuScene extends Scene {
  constructor(ctx: EngineContext) {
    super(ctx);
  }

  onEnter(): void {
    // Static screen — no systems.
  }

  render(renderer: Renderer, _alpha: number): void {
    const ctx = renderer.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0b0b12";
    ctx.fillRect(0, 0, renderer.width, renderer.height);

    const cx = renderer.width / 2;
    ctx.textAlign = "center";

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 52px system-ui, sans-serif";
    ctx.fillText("SEMLA", cx, renderer.height / 2 - 60);

    ctx.fillStyle = "#9b9bb5";
    ctx.font = "18px system-ui, sans-serif";
    ctx.fillText("a bullet-heaven engine", cx, renderer.height / 2 - 24);

    ctx.fillStyle = "#e8e8f0";
    ctx.font = "20px system-ui, sans-serif";
    ctx.fillText("WASD / arrows to move", cx, renderer.height / 2 + 30);
    ctx.fillText("Weapons fire automatically", cx, renderer.height / 2 + 58);

    ctx.fillStyle = "#46c0ff";
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.fillText("Press any key or click to start", cx, renderer.height / 2 + 110);

    const i = this.ctx.input;
    if (
      i.isDown("Space") ||
      i.isDown("Enter") ||
      i.pointerDown ||
      i.getMovementAxis().lengthSq() > 0
    ) {
      this.ctx.scenes.change(new GameScene(this.ctx));
    }
  }
}
