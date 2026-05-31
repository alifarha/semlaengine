import { Vector2 } from "../math/Vector2";

/**
 * Keyboard and pointer input.
 *
 * Tracks both the held state and edge transitions (pressed/released this frame).
 * Call {@link postUpdate} at the end of each fixed step to clear the
 * per-frame edge sets.
 */
export class InputManager {
  private readonly down = new Set<string>();
  private readonly pressedThisFrame = new Set<string>();
  private readonly releasedThisFrame = new Set<string>();

  readonly pointer = new Vector2(0, 0);
  pointerDown = false;

  constructor(private readonly target: HTMLElement = document.body) {
    this.attach();
  }

  private attach(): void {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.target.addEventListener("pointermove", this.onPointerMove);
    this.target.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
    // Avoid "stuck keys" when the window loses focus mid-press.
    window.addEventListener("blur", this.onBlur);
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.target.removeEventListener("pointermove", this.onPointerMove);
    this.target.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("blur", this.onBlur);
  }

  isDown(code: string): boolean {
    return this.down.has(code);
  }

  wasPressed(code: string): boolean {
    return this.pressedThisFrame.has(code);
  }

  wasReleased(code: string): boolean {
    return this.releasedThisFrame.has(code);
  }

  /**
   * Normalised WASD / arrow-key movement direction. Returns a fresh vector with
   * length 0 or 1 — exactly what a movement system wants.
   */
  getMovementAxis(): Vector2 {
    let x = 0;
    let y = 0;
    if (this.isDown("KeyA") || this.isDown("ArrowLeft")) x -= 1;
    if (this.isDown("KeyD") || this.isDown("ArrowRight")) x += 1;
    if (this.isDown("KeyW") || this.isDown("ArrowUp")) y -= 1;
    if (this.isDown("KeyS") || this.isDown("ArrowDown")) y += 1;
    return new Vector2(x, y).normalize();
  }

  /** Clear per-frame edge sets. Call once per fixed update, after systems run. */
  postUpdate(): void {
    this.pressedThisFrame.clear();
    this.releasedThisFrame.clear();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.down.has(e.code)) this.pressedThisFrame.add(e.code);
    this.down.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.down.delete(e.code);
    this.releasedThisFrame.add(e.code);
  };

  private onPointerMove = (e: PointerEvent): void => {
    const rect = (this.target as HTMLElement).getBoundingClientRect();
    this.pointer.set(e.clientX - rect.left, e.clientY - rect.top);
  };

  private onPointerDown = (): void => {
    this.pointerDown = true;
  };

  private onPointerUp = (): void => {
    this.pointerDown = false;
  };

  private onBlur = (): void => {
    this.down.clear();
    this.pressedThisFrame.clear();
    this.releasedThisFrame.clear();
  };
}
