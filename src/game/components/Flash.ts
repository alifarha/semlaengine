import type { Component } from "@engine";

/**
 * A brief tint applied when an entity is hit, giving impact a visible "pop".
 * `RenderSystem` draws the entity in `color` while `remaining > 0`;
 * `EffectsSystem` counts it down and removes it when spent.
 */
export class Flash implements Component {
  constructor(
    public remaining: number,
    public color = "#ffffff",
  ) {}
}
