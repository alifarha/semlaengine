import type { Component } from "@engine";

/** A damage-dealing projectile fired by a weapon. */
export class Projectile implements Component {
  /** Enemies remaining this projectile can still hit before despawning. */
  pierceRemaining: number;

  constructor(
    public damage: number,
    pierce = 1,
  ) {
    this.pierceRemaining = pierce;
  }
}
