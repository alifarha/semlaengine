import { Scene, type EngineContext, type Renderer, type Time } from "@engine";
import { loadMeta } from "../meta";
import { GameScene } from "./GameScene";
import { UpgradeScene } from "./UpgradeScene";

/** Title screen. Press any movement key or click to start; U opens the Barrow. */
export class MenuScene extends Scene {
  private shards = 0;

  constructor(ctx: EngineContext) {
    super(ctx);
  }

  onEnter(): void {
    // Static screen — no systems.
    this.shards = loadMeta().shards;
  }

  override update(time: Time): void {
    super.update(time);
    const i = this.ctx.input;

    if (i.wasPressed("KeyU")) {
      this.ctx.scenes.change(new UpgradeScene(this.ctx));
      return;
    }
    if (
      i.isDown("Space") ||
      i.isDown("Enter") ||
      i.pointerDown ||
      i.getMovementAxis().lengthSq() > 0
    ) {
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

    ctx.fillStyle = "#d4af6a";
    ctx.font = "16px Georgia, serif";
    ctx.fillText(
      `U — the Barrow (upgrades) · ✦ ${this.shards} shards`,
      cx,
      renderer.height / 2 + 146,
    );
  }
}
