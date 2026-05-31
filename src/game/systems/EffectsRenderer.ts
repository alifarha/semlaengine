import { type World, type Renderer, Transform } from "@engine";
import { FloatingText } from "../components/FloatingText";

/**
 * Draws world-space {@link FloatingText} (damage numbers, popups). Like
 * `RenderSystem` it runs in the render phase, between the renderer's
 * `begin`/`end`, so text is positioned in the world and moves with the camera.
 * Particles need no special renderer — they carry a Sprite and are drawn by the
 * normal `RenderSystem`.
 */
export class EffectsRenderer {
  render(world: World, renderer: Renderer): void {
    const ctx = renderer.ctx;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const entity of world.query(FloatingText, Transform)) {
      const ft = world.get(entity, FloatingText)!;
      const pos = world.get(entity, Transform)!.position;
      const t = ft.age / ft.life;
      // Fade out over the back half of its life.
      ctx.globalAlpha = t < 0.5 ? 1 : 1 - (t - 0.5) * 2;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.size}px system-ui, sans-serif`;
      ctx.fillText(ft.text, pos.x, pos.y);
    }
    ctx.globalAlpha = 1;
  }
}
