import type { Component } from "../Component";

/** Hit points plus brief post-hit invulnerability. */
export class Health implements Component {
  current: number;
  max: number;

  /** Seconds of invulnerability remaining after taking a hit. */
  invulnerable = 0;

  /** Default i-frames applied when damaged. */
  invulnerabilityDuration: number;

  constructor(max: number, invulnerabilityDuration = 0) {
    this.max = max;
    this.current = max;
    this.invulnerabilityDuration = invulnerabilityDuration;
  }

  get isDead(): boolean {
    return this.current <= 0;
  }

  get isInvulnerable(): boolean {
    return this.invulnerable > 0;
  }
}
