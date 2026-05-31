import type { Component } from "@engine";

/**
 * Tags an entity as the player and holds its run-time stats. Upgrades mutate
 * these values (e.g. +move speed, +magnet radius) as the player levels up.
 */
export class Player implements Component {
  /** Movement speed in world units per second. */
  moveSpeed = 140;

  /** Radius within which experience gems fly toward the player. */
  magnetRadius = 70;

  /** Damage multiplier applied to all weapons. */
  might = 1;
}
