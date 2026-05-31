import type { Scene } from "./Scene";
import type { Time } from "./Time";
import type { Renderer } from "../rendering/Renderer";

/**
 * Owns the active scene and handles transitions. Switching is deferred to the
 * top of the next update so a scene can request a change from inside its own
 * `update` without tearing itself down mid-frame.
 */
export class SceneManager {
  private current: Scene | null = null;
  private pending: Scene | null = null;

  /** Queue a scene to become active next frame. */
  change(scene: Scene): void {
    this.pending = scene;
  }

  get active(): Scene | null {
    return this.current;
  }

  update(time: Time): void {
    if (this.pending) {
      this.current?.onExit();
      this.current = this.pending;
      this.pending = null;
      this.current.onEnter();
    }
    this.current?.update(time);
  }

  render(renderer: Renderer, alpha: number): void {
    this.current?.render(renderer, alpha);
  }
}
