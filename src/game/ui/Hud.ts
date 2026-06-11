import { type World, type Renderer, Health } from "@engine";
import { Player } from "../components/Player";
import { PlayerProgress } from "../components/PlayerProgress";
import { DraugrForm, FormState } from "../components/DraugrForm";
import { Boss } from "../components/Boss";
import { WeaponInventory } from "../components/WeaponInventory";
import { WEAPONS } from "../data/weapons";

/** Colour the form badge + sál bar take per draugr form. */
const FORM_COLOR: Record<string, string> = {
  [FormState.Starving]: "#b9a98f",
  [FormState.Risen]: "#d4af6a",
  [FormState.Gorged]: "#ffd9a0",
  [FormState.BarrowKing]: "#8fb6ff",
};

/**
 * Screen-space HUD: sál (level) bar, level/timer/kills, plus the draugr's
 * vigour bar, fullness (form) gauge and form badge. Drawn outside the camera
 * transform so it stays fixed on screen.
 */
export class Hud {
  render(world: World, renderer: Renderer, elapsed: number): void {
    const ctx = renderer.ctx;
    const playerEntity = world.first(Player, PlayerProgress);

    // --- Sál (level progress) bar across the top ---
    const progress =
      playerEntity >= 0 ? world.get(playerEntity, PlayerProgress)! : null;
    const salFraction = progress ? progress.xp / progress.xpToNext : 0;

    ctx.fillStyle = "#23233a";
    ctx.fillRect(0, 0, renderer.width, 8);
    ctx.fillStyle = "#46c0ff";
    ctx.fillRect(0, 0, renderer.width * salFraction, 8);

    // --- Level + timer + kills ---
    ctx.fillStyle = "#e8e8f0";
    ctx.font = "16px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    if (progress) ctx.fillText(`Lv ${progress.level}`, 12, 16);

    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    ctx.textAlign = "center";
    ctx.fillText(`${minutes}:${seconds.toString().padStart(2, "0")}`, renderer.width / 2, 16);

    if (progress) {
      ctx.textAlign = "right";
      ctx.fillText(`Kills ${progress.kills}`, renderer.width - 12, 16);
    }

    // --- Boss health bars (top-centre, when an encounter is active) ---
    const bosses = world.queryArray(Boss, Health);
    if (bosses.length > 0) {
      const bw = 320;
      const bx = (renderer.width - bw) / 2;
      let by = 34;
      for (const e of bosses) {
        const boss = world.get(e, Boss)!;
        const health = world.get(e, Health)!;
        ctx.fillStyle = "#2a0d12";
        ctx.fillRect(bx, by, bw, 9);
        ctx.fillStyle = boss.enraged ? "#c0392b" : "#b8922a";
        ctx.fillRect(bx, by, bw * Math.max(0, health.current / health.max), 9);
        ctx.fillStyle = "#e8e8f0";
        ctx.font = "10px Georgia, serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(boss.enraged ? `${boss.name} — enraged` : boss.name, renderer.width / 2, by - 1);
        by += 24;
      }
      ctx.textBaseline = "top";
    }

    if (playerEntity < 0) return;

    // --- Armament list (bottom-right) ---
    const inventory = world.get(playerEntity, WeaponInventory);
    if (inventory) {
      ctx.font = "12px Georgia, serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      let wy = renderer.height - 14;
      for (let i = inventory.weapons.length - 1; i >= 0; i--) {
        const weapon = inventory.weapons[i];
        ctx.fillStyle = "#9b8f76";
        ctx.fillText(WEAPONS[weapon.id]?.name ?? weapon.id, renderer.width - 12, wy);
        wy -= 16;
      }
      ctx.textBaseline = "top";
    }

    // --- Bottom-left status stack: vigour, fullness, form badge ---
    const x = 12;
    const barW = 180;
    let y = renderer.height - 12;

    const form = world.get(playerEntity, DraugrForm);
    if (form) {
      const color = FORM_COLOR[form.state] ?? "#d4af6a";

      // Form badge.
      y -= 18;
      ctx.fillStyle = color;
      ctx.font = "bold 13px Georgia, serif";
      ctx.textAlign = "left";
      ctx.fillText(form.state.toUpperCase(), x, y);

      // Fullness (sál) gauge.
      y -= 12;
      ctx.fillStyle = "#1c1810";
      ctx.fillRect(x, y, barW, 8);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barW * Math.max(0, Math.min(1, form.fullness)), 8);
      y -= 6;
    }

    // Vigour (health) bar.
    const health = world.get(playerEntity, Health);
    if (health) {
      const h = 14;
      y -= h;
      ctx.fillStyle = "#3a1320";
      ctx.fillRect(x, y, barW, h);
      ctx.fillStyle = "#ff5470";
      ctx.fillRect(x, y, barW * Math.max(0, health.current / health.max), h);
      ctx.strokeStyle = "#00000055";
      ctx.strokeRect(x, y, barW, h);
      ctx.fillStyle = "#ffffff";
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`${Math.max(0, Math.ceil(health.current))}/${health.max}`, x + 6, y + 2);
    }
  }
}
