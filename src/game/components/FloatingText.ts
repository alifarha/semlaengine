import type { Component } from "@engine";

/**
 * World-space text that drifts upward and fades — used for damage numbers and
 * "LEVEL UP!" popups. Updated by `EffectsSystem`, drawn by `EffectsRenderer`.
 */
export class FloatingText implements Component {
  age = 0;

  constructor(
    public text: string,
    public color = "#ffffff",
    public life = 0.7,
    /** Upward drift speed in world units per second. */
    public riseSpeed = 32,
    public size = 12,
  ) {}
}
