import type { Component } from "../Component";

/**
 * Visual representation of an entity.
 *
 * The scaffold ships with a "shape" fallback so the demo renders without any
 * art assets. Swap to image-based sprites by setting `image` and the source
 * rectangle once an {@link AssetLoader} is wired up.
 */
export class Sprite implements Component {
  /** Optional bitmap; when present it is drawn instead of the shape. */
  image: HTMLImageElement | HTMLCanvasElement | null = null;

  /** Source rect within the image (for sprite sheets). */
  sx = 0;
  sy = 0;
  sw = 0;
  sh = 0;

  /** Fallback primitive when no image is set. */
  shape: "circle" | "rect" = "circle";

  /** Render size in world units (diameter for circle, side length for rect). */
  width: number;
  height: number;

  /** CSS color used for the shape fallback or as a tint placeholder. */
  color: string;

  /** Draw order; higher renders on top. */
  layer: number;

  /** Per-sprite opacity [0,1]. */
  alpha = 1;

  constructor(opts: Partial<Sprite> = {}) {
    this.width = opts.width ?? 16;
    this.height = opts.height ?? 16;
    this.color = opts.color ?? "#ffffff";
    this.layer = opts.layer ?? 0;
    this.shape = opts.shape ?? "circle";
    Object.assign(this, opts);
  }
}
