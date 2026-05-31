import type { Component } from "../Component";
import { Vector2 } from "../../math/Vector2";

/** World-space position, rotation and scale of an entity. */
export class Transform implements Component {
  readonly position: Vector2;
  /** Position at the start of the current step, used for render interpolation. */
  readonly previousPosition: Vector2;
  rotation: number;
  scale: number;

  constructor(x = 0, y = 0, rotation = 0, scale = 1) {
    this.position = new Vector2(x, y);
    this.previousPosition = new Vector2(x, y);
    this.rotation = rotation;
    this.scale = scale;
  }

  /** Snapshot the current position so the renderer can interpolate. */
  savePrevious(): void {
    this.previousPosition.copy(this.position);
  }
}
