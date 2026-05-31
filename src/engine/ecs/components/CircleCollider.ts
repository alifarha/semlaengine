import type { Component } from "../Component";

/**
 * A circular collider. Circles are used throughout because circle-vs-circle
 * overlap is a single distance check — ideal when resolving collisions between
 * thousands of enemies and projectiles each frame.
 *
 * `layer` is the collision category this entity belongs to; `mask` is the set
 * of categories it should test against. Both are bitfields — see
 * {@link CollisionLayers}.
 */
export class CircleCollider implements Component {
  constructor(
    public radius = 8,
    public layer = 0,
    public mask = 0,
  ) {}
}

/** Collision category bitflags. Extend as the game grows. */
export const CollisionLayers = {
  None: 0,
  Player: 1 << 0,
  Enemy: 1 << 1,
  PlayerProjectile: 1 << 2,
  EnemyProjectile: 1 << 3,
  Pickup: 1 << 4,
} as const;

export type CollisionLayer =
  (typeof CollisionLayers)[keyof typeof CollisionLayers];
