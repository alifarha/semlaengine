import type { Component } from "../Component";
import { Vector2 } from "../../math/Vector2";

/** Linear velocity in world units per second. */
export class Velocity implements Component {
  readonly value: Vector2;

  constructor(x = 0, y = 0) {
    this.value = new Vector2(x, y);
  }
}
