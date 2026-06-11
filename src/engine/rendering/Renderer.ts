import { Camera } from "./Camera";
import { Vector2 } from "../math/Vector2";

/**
 * Thin wrapper around the 2D canvas context.
 *
 * It owns the camera transform and exposes small primitives used by the render
 * system and UI. A `begin`/`end` pair clears the frame and applies the camera
 * so world-space draw calls land in the right place. Screen-space UI should be
 * drawn after `end`.
 */
export class Renderer {
  readonly ctx: CanvasRenderingContext2D;
  readonly camera: Camera;

  /** Background fill color used each frame. */
  clearColor = "#15151f";

  /** Device pixel ratio the backing store is scaled by. */
  private dpr = 1;
  /** Logical (CSS pixel) size — all drawing and UI math uses these units. */
  private logicalWidth: number;
  private logicalHeight: number;

  private readonly scratch = new Vector2();

  constructor(public readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Semla: 2D canvas context unavailable.");
    this.ctx = ctx;
    this.logicalWidth = canvas.width;
    this.logicalHeight = canvas.height;
    this.camera = new Camera(this.logicalWidth, this.logicalHeight);
  }

  get width(): number {
    return this.logicalWidth;
  }
  get height(): number {
    return this.logicalHeight;
  }

  /**
   * Resize the drawing surface to a CSS-pixel size, scaling the backing store
   * by the device pixel ratio so rendering stays crisp on HiDPI displays.
   * All drawing continues to use CSS-pixel units.
   */
  resize(cssWidth: number, cssHeight: number): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.logicalWidth = Math.max(1, Math.round(cssWidth));
    this.logicalHeight = Math.max(1, Math.round(cssHeight));
    this.canvas.width = Math.round(this.logicalWidth * this.dpr);
    this.canvas.height = Math.round(this.logicalHeight * this.dpr);
    this.canvas.style.width = `${this.logicalWidth}px`;
    this.canvas.style.height = `${this.logicalHeight}px`;
    this.camera.resize(this.logicalWidth, this.logicalHeight);
  }

  /**
   * Reset to the screen-space (UI) transform. Use this instead of a raw
   * `ctx.setTransform(1, 0, 0, 1, 0, 0)` — identity would bypass the device
   * pixel ratio scaling and draw UI at the wrong size on HiDPI displays.
   */
  resetTransform(): void {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /** Clear and apply the camera transform. World draws go between begin/end. */
  begin(): void {
    const { ctx, camera } = this;
    this.resetTransform();
    ctx.fillStyle = this.clearColor;
    ctx.fillRect(0, 0, this.width, this.height);

    // Random screen-shake offset, scaled by current trauma.
    const shake = camera.shakeMagnitude;
    const ox = shake > 0 ? (Math.random() * 2 - 1) * shake : 0;
    const oy = shake > 0 ? (Math.random() * 2 - 1) * shake : 0;

    // Apply camera: translate to centre, zoom, then offset by camera position.
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.position.x + ox, -camera.position.y + oy);
  }

  end(): void {
    this.resetTransform();
  }

  drawCircle(x: number, y: number, radius: number, color: string, alpha = 1): void {
    const { ctx } = this;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawRect(x: number, y: number, w: number, h: number, color: string, alpha = 1): void {
    const { ctx } = this;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.globalAlpha = 1;
  }

  drawImage(
    image: CanvasImageSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    alpha = 1,
  ): void {
    const { ctx } = this;
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, sx, sy, sw, sh, dx - dw / 2, dy - dh / 2, dw, dh);
    ctx.globalAlpha = 1;
  }

  /** Draw a tiled background grid — handy placeholder for the play field. */
  drawGrid(cellSize: number, color: string): void {
    const { ctx, camera } = this;
    const halfW = this.width / (2 * camera.zoom);
    const halfH = this.height / (2 * camera.zoom);
    const left = camera.position.x - halfW;
    const right = camera.position.x + halfW;
    const top = camera.position.y - halfH;
    const bottom = camera.position.y + halfH;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1 / camera.zoom;
    ctx.beginPath();
    for (let x = Math.floor(left / cellSize) * cellSize; x <= right; x += cellSize) {
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
    }
    for (let y = Math.floor(top / cellSize) * cellSize; y <= bottom; y += cellSize) {
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();
  }

  /** Convenience used by UI: a point's screen coordinates. */
  worldToScreen(world: Vector2): Vector2 {
    return this.camera.worldToScreen(world.x, world.y, this.scratch);
  }
}
