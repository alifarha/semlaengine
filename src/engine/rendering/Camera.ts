import { Vector2 } from "../math/Vector2";
import { clamp } from "../math/MathUtils";

/**
 * A 2D camera that maps world space to screen space.
 *
 * For a survivor game the camera typically follows the player with a little
 * smoothing. `zoom` scales the view; `viewport` is the canvas size in pixels.
 */
export class Camera {
  readonly position = new Vector2(0, 0);
  zoom = 1;

  /** How quickly the camera catches up to its target, per second [0,1]. */
  followLerp = 0.12;

  constructor(
    public viewportWidth: number,
    public viewportHeight: number,
  ) {}

  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  /** Smoothly move the camera centre toward `target`. */
  follow(target: Vector2, smoothing = this.followLerp): void {
    const t = clamp(smoothing, 0, 1);
    this.position.x += (target.x - this.position.x) * t;
    this.position.y += (target.y - this.position.y) * t;
  }

  /** Immediately centre on a point (no smoothing). */
  snapTo(target: Vector2): void {
    this.position.copy(target);
  }

  worldToScreen(worldX: number, worldY: number, out = new Vector2()): Vector2 {
    out.x = (worldX - this.position.x) * this.zoom + this.viewportWidth / 2;
    out.y = (worldY - this.position.y) * this.zoom + this.viewportHeight / 2;
    return out;
  }

  screenToWorld(screenX: number, screenY: number, out = new Vector2()): Vector2 {
    out.x = (screenX - this.viewportWidth / 2) / this.zoom + this.position.x;
    out.y = (screenY - this.viewportHeight / 2) / this.zoom + this.position.y;
    return out;
  }
}
