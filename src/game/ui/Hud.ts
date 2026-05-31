import { type World, type Renderer, Health } from "@engine";
import { Player } from "../components/Player";
import { PlayerProgress } from "../components/PlayerProgress";

/**
 * Screen-space heads-up display: XP bar, level, run timer and health. Drawn
 * after the world (outside the camera transform) so it stays fixed on screen.
 */
export class Hud {
  render(world: World, renderer: Renderer, elapsed: number): void {
    const ctx = renderer.ctx;
    const playerEntity = world.first(Player, PlayerProgress);

    // --- XP bar across the top ---
    const progress =
      playerEntity >= 0 ? world.get(playerEntity, PlayerProgress)! : null;
    const xpFraction = progress ? progress.xp / progress.xpToNext : 0;

    ctx.fillStyle = "#23233a";
    ctx.fillRect(0, 0, renderer.width, 8);
    ctx.fillStyle = "#46c0ff";
    ctx.fillRect(0, 0, renderer.width * xpFraction, 8);

    // --- Level + timer ---
    ctx.fillStyle = "#e8e8f0";
    ctx.font = "16px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    if (progress) ctx.fillText(`Lv ${progress.level}`, 12, 16);

    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    ctx.textAlign = "center";
    ctx.fillText(timeStr, renderer.width / 2, 16);

    if (progress) {
      ctx.textAlign = "right";
      ctx.fillText(`Kills ${progress.kills}`, renderer.width - 12, 16);
    }

    // --- Health bar bottom-left ---
    if (playerEntity >= 0) {
      const health = world.get(playerEntity, Health);
      if (health) {
        const w = 180;
        const h = 14;
        const x = 12;
        const y = renderer.height - h - 12;
        ctx.fillStyle = "#3a1320";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#ff5470";
        ctx.fillRect(x, y, w * Math.max(0, health.current / health.max), h);
        ctx.strokeStyle = "#00000055";
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "#ffffff";
        ctx.font = "11px system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(
          `${Math.max(0, Math.ceil(health.current))}/${health.max}`,
          x + 6,
          y + 2,
        );
      }
    }
  }
}
