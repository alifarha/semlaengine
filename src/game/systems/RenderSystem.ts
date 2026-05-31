import {
  type World,
  type Entity,
  type Renderer,
  Transform,
  Sprite,
} from "@engine";
import { Flash } from "../components/Flash";

/**
 * Draws every entity that has a {@link Transform} and {@link Sprite}.
 *
 * This is not a simulation {@link System} — it runs in the render phase and
 * receives the interpolation `alpha`, blending each entity between its previous
 * and current position for smooth motion independent of the fixed update rate.
 *
 * Entities are sorted by sprite layer each frame. For very large entity counts
 * a bucketed/insertion approach would cut the per-frame sort cost.
 */
export class RenderSystem {
  private readonly drawList: Entity[] = [];

  render(world: World, renderer: Renderer, alpha: number): void {
    this.drawList.length = 0;
    for (const entity of world.query(Transform, Sprite)) {
      this.drawList.push(entity);
    }

    this.drawList.sort(
      (a, b) =>
        world.get(a, Sprite)!.layer - world.get(b, Sprite)!.layer,
    );

    for (const entity of this.drawList) {
      const transform = world.get(entity, Transform)!;
      const sprite = world.get(entity, Sprite)!;

      // Interpolate between the previous and current fixed-step positions.
      const x =
        transform.previousPosition.x +
        (transform.position.x - transform.previousPosition.x) * alpha;
      const y =
        transform.previousPosition.y +
        (transform.position.y - transform.previousPosition.y) * alpha;

      // A Flash component overrides the draw color for a brief hit "pop".
      const flash = world.get(entity, Flash);
      const color = flash && flash.remaining > 0 ? flash.color : sprite.color;

      if (sprite.image) {
        renderer.drawImage(
          sprite.image,
          sprite.sx,
          sprite.sy,
          sprite.sw,
          sprite.sh,
          x,
          y,
          sprite.width,
          sprite.height,
          sprite.alpha,
        );
      } else if (sprite.shape === "circle") {
        renderer.drawCircle(x, y, sprite.width / 2, color, sprite.alpha);
      } else {
        renderer.drawRect(x, y, sprite.width, sprite.height, color, sprite.alpha);
      }
    }
  }
}
