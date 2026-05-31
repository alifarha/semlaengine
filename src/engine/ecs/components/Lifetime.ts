import type { Component } from "../Component";

/**
 * Auto-destroys its entity after `remaining` seconds. Used for projectiles,
 * damage numbers, particles and other transient entities.
 */
export class Lifetime implements Component {
  constructor(public remaining: number) {}
}
