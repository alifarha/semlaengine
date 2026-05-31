import {
  System,
  type World,
  type Time,
  type Entity,
  Transform,
  Health,
  CircleCollider,
  SpatialHashGrid,
} from "@engine";
import { Player } from "../components/Player";
import { Enemy } from "../components/Enemy";
import { Projectile } from "../components/Projectile";

/**
 * Resolves the two combat interactions every frame using a broadphase grid:
 *   1. player projectiles damaging enemies, and
 *   2. enemies dealing contact damage to the player.
 *
 * Enemies are bucketed into a {@link SpatialHashGrid} once, then both passes
 * query only nearby cells — keeping this near O(n) even with a large swarm.
 * Death is not handled here; zeroed health is reaped by `DeathSystem`, which
 * keeps damage and death-effects cleanly separated.
 */
export class CollisionSystem extends System {
  private readonly grid = new SpatialHashGrid(48);
  private readonly candidates: Entity[] = [];

  update(world: World, time: Time): void {
    this.rebuildEnemyGrid(world);
    this.resolveProjectiles(world);
    this.resolvePlayerContact(world, time);
  }

  private rebuildEnemyGrid(world: World): void {
    this.grid.clear();
    for (const enemy of world.query(Enemy, Transform)) {
      const pos = world.get(enemy, Transform)!.position;
      this.grid.insert(enemy, pos.x, pos.y);
    }
  }

  private resolveProjectiles(world: World): void {
    for (const proj of world.query(Projectile, Transform, CircleCollider)) {
      const projectile = world.get(proj, Projectile)!;
      const pos = world.get(proj, Transform)!.position;
      const radius = world.get(proj, CircleCollider)!.radius;

      this.grid.queryCircle(pos.x, pos.y, radius + 16, this.candidates);
      for (const enemy of this.candidates) {
        if (!world.isAlive(enemy)) continue;
        const enemyPos = world.get(enemy, Transform)!.position;
        const enemyRadius = world.get(enemy, CircleCollider)!.radius;
        const reach = radius + enemyRadius;
        if (pos.distanceToSq(enemyPos) > reach * reach) continue;

        const health = world.get(enemy, Health);
        if (health) health.current -= projectile.damage;

        if (--projectile.pierceRemaining <= 0) {
          world.destroyEntity(proj);
          break;
        }
      }
    }
  }

  private resolvePlayerContact(world: World, time: Time): void {
    const playerEntity = world.first(Player, Transform, Health, CircleCollider);
    if (playerEntity < 0) return;

    const health = world.get(playerEntity, Health)!;
    if (health.invulnerable > 0) {
      health.invulnerable -= time.scaledDelta;
      return; // i-frames: skip contact damage entirely this step
    }

    const pos = world.get(playerEntity, Transform)!.position;
    const radius = world.get(playerEntity, CircleCollider)!.radius;

    this.grid.queryCircle(pos.x, pos.y, radius + 16, this.candidates);
    for (const enemy of this.candidates) {
      const enemyPos = world.get(enemy, Transform)!.position;
      const enemyRadius = world.get(enemy, CircleCollider)!.radius;
      const reach = radius + enemyRadius;
      if (pos.distanceToSq(enemyPos) > reach * reach) continue;

      health.current -= world.get(enemy, Enemy)!.contactDamage;
      health.invulnerable = health.invulnerabilityDuration;
      break; // one hit per i-frame window
    }
  }
}
