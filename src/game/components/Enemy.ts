import type { Component } from "@engine";

/**
 * Tags an entity as an enemy. The default behaviour (see `EnemyAISystem`) is to
 * walk straight toward the player — the classic survivor swarm. `xpValue` is
 * dropped as a gem on death; `contactDamage` is dealt when touching the player.
 */
export class Enemy implements Component {
  constructor(
    public speed = 45,
    public contactDamage = 8,
    public xpValue = 1,
  ) {}
}
