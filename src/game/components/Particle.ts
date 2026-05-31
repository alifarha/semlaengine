import type { Component } from "@engine";

/**
 * A short-lived visual particle (spark, blood, debris). Moved and faded by the
 * `EffectsSystem`; drawn by the normal `RenderSystem` since particles also have
 * a Sprite. Tagged Transient so it's never serialized.
 */
export class Particle implements Component {
  age = 0;

  constructor(
    public vx: number,
    public vy: number,
    public life: number,
    /** Velocity damping per second (0 = none, higher = stops faster). */
    public friction = 4,
  ) {}
}
