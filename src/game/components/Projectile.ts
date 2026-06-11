import type { Component, Entity } from "@engine";

/** A damage-dealing projectile fired by a weapon. */
export class Projectile implements Component {
  /** Enemies remaining this projectile can still hit before despawning. */
  pierceRemaining: number;

  /**
   * Enemies already struck, so a piercing projectile damages each enemy once
   * while passing through instead of re-hitting it every step they overlap.
   * Not serialized — entity ids are remapped on load anyway.
   */
  readonly hitEnemies = new Set<Entity>();

  constructor(
    public damage: number,
    pierce = 1,
  ) {
    this.pierceRemaining = pierce;
  }
}
