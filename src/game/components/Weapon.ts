import type { Component } from "@engine";

/**
 * An auto-firing weapon attached to the player. The defining feature of the
 * genre: the player never aims or shoots manually — weapons fire on a cooldown
 * and pick targets automatically.
 *
 * Multiple weapons can be added to the same entity by composing several systems
 * or extending this into a list; the scaffold keeps one weapon per component
 * for clarity. Upgrades adjust cooldown, damage, projectile count, etc.
 */
export class Weapon implements Component {
  /** Seconds between shots. */
  cooldown: number;
  /** Counts down to the next shot. */
  timer = 0;

  /** Base damage per projectile (before player `might`). */
  damage: number;
  /** Projectile travel speed in world units per second. */
  projectileSpeed: number;
  /** Seconds a projectile lives before despawning. */
  projectileLifetime: number;
  /** How many enemies a projectile can hit before despawning. */
  pierce: number;
  /** Projectiles launched per shot. */
  count: number;

  // Defaults mirror the "bolt" blueprint in data/weapons.ts.
  constructor(opts: Partial<Weapon> = {}) {
    this.cooldown = opts.cooldown ?? 0.7;
    this.damage = opts.damage ?? 10;
    this.projectileSpeed = opts.projectileSpeed ?? 280;
    this.projectileLifetime = opts.projectileLifetime ?? 1.4;
    this.pierce = opts.pierce ?? 1;
    this.count = opts.count ?? 1;
  }
}
