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

  /**
   * Screen-shake "trauma" in [0,1]. Effects add trauma on impactful events; it
   * decays over time. The actual offset uses trauma² so small amounts stay
   * subtle while big hits punch — a common, good-feeling shake curve.
   */
  trauma = 0;
  /** Maximum shake displacement in world units at full trauma. */
  maxShakeOffset = 10;
  /** Trauma units shed per second. */
  traumaDecay = 1.6;

  constructor(
    public viewportWidth: number,
    public viewportHeight: number,
  ) {}

  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  /** Add screen-shake trauma (clamped to [0,1]). */
  addTrauma(amount: number): void {
    this.trauma = clamp(this.trauma + amount, 0, 1);
  }

  /** Decay trauma. Driven from the simulation each step. */
  updateShake(dt: number): void {
    if (this.trauma > 0) this.trauma = Math.max(0, this.trauma - this.traumaDecay * dt);
  }

  /** Current shake magnitude (world units) — random offset is applied by the renderer. */
  get shakeMagnitude(): number {
    return this.trauma * this.trauma * this.maxShakeOffset;
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
