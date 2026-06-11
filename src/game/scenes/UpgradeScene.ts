import { Scene, type Renderer, type Time } from "@engine";
import {
  META_UPGRADES,
  loadMeta,
  buyUpgrade,
  upgradeCost,
  type MetaState,
} from "../meta";
import { MenuScene } from "./MenuScene";

/**
 * "The Barrow" — the meta-progression shop. Sál shards earned across runs buy
 * permanent upgrades that are baked into every future player (see
 * `createPlayer`). Reached from the menu; purchases persist via `meta.ts`.
 */
export class UpgradeScene extends Scene {
  private state: MetaState = loadMeta();

  onEnter(): void {
    // Static screen — no systems.
  }

  override update(time: Time): void {
    super.update(time);
    const input = this.ctx.input;

    for (let i = 0; i < META_UPGRADES.length; i++) {
      if (input.wasPressed(`Digit${i + 1}`)) {
        const next = buyUpgrade(META_UPGRADES[i].id);
        if (next) {
          this.state = next;
          this.ctx.audio.tone({ freq: 660, slideTo: 990, duration: 0.08, type: "sine", gain: 0.12 });
        } else {
          this.ctx.audio.tone({ freq: 220, slideTo: 160, duration: 0.1, type: "square", gain: 0.08 });
        }
      }
    }

    if (input.wasPressed("Escape") || input.wasPressed("KeyB")) {
      this.ctx.scenes.change(new MenuScene(this.ctx));
    }
  }

  render(renderer: Renderer, _alpha: number): void {
    const ctx = renderer.ctx;
    renderer.resetTransform();
    ctx.fillStyle = "#0b0b12";
    ctx.fillRect(0, 0, renderer.width, renderer.height);

    const cx = renderer.width / 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = "#d4af6a";
    ctx.font = "bold 36px Georgia, serif";
    ctx.fillText("THE BARROW", cx, 86);

    ctx.fillStyle = "#9b8f76";
    ctx.font = "italic 14px Georgia, serif";
    ctx.fillText("What the grave keeps, the grave grants.", cx, 112);

    ctx.fillStyle = "#46e0a0";
    ctx.font = "18px Georgia, serif";
    ctx.fillText(`✦ ${this.state.shards} sál shards`, cx, 148);

    // Upgrade rows.
    const rowW = Math.min(620, renderer.width - 60);
    const rowH = 58;
    let y = 184;
    for (let i = 0; i < META_UPGRADES.length; i++) {
      const def = META_UPGRADES[i];
      const level = this.state.upgrades[def.id] ?? 0;
      const maxed = level >= def.maxLevel;
      const cost = maxed ? 0 : upgradeCost(def, level);
      const affordable = !maxed && this.state.shards >= cost;
      const x = cx - rowW / 2;

      ctx.fillStyle = "#14100a";
      ctx.fillRect(x, y, rowW, rowH);
      ctx.strokeStyle = affordable ? "#d4af6a" : "#3a3526";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.5, y + 0.5, rowW - 1, rowH - 1);

      // Key badge.
      ctx.fillStyle = affordable ? "#8b1a1a" : "#2a2118";
      ctx.fillRect(x + 10, y + 16, 26, 26);
      ctx.fillStyle = "#f0e8d8";
      ctx.font = "bold 14px Georgia, serif";
      ctx.fillText(`${i + 1}`, x + 23, y + 34);

      ctx.textAlign = "left";
      ctx.fillStyle = "#f0e8d8";
      ctx.font = "bold 16px Georgia, serif";
      ctx.fillText(`${def.name}  ·  Lv ${level}/${def.maxLevel}`, x + 48, y + 24);
      ctx.fillStyle = "#9b8f76";
      ctx.font = "13px Georgia, serif";
      ctx.fillText(def.description, x + 48, y + 44);

      ctx.textAlign = "right";
      ctx.font = "15px Georgia, serif";
      if (maxed) {
        ctx.fillStyle = "#d4af6a";
        ctx.fillText("MAX", x + rowW - 14, y + 34);
      } else {
        ctx.fillStyle = affordable ? "#46e0a0" : "#5a5346";
        ctx.fillText(`✦ ${cost}`, x + rowW - 14, y + 34);
      }
      ctx.textAlign = "center";

      y += rowH + 10;
    }

    ctx.fillStyle = "#9b9bb5";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText("Press 1–4 to buy · Esc to return", cx, y + 24);
  }
}
