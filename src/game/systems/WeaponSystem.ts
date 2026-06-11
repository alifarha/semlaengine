import { System, type World, type Time, Transform, Vector2 } from "@engine";
import { Player } from "../components/Player";
import { Weapon } from "../components/Weapon";
import { Enemy } from "../components/Enemy";
import { DraugrForm } from "../components/DraugrForm";
import { createProjectile } from "../entities/createProjectile";
import type { GameEventBus } from "../events";

/**
 * Auto-fires each weapon on its cooldown, aiming at the nearest enemy. When a
 * weapon fires `count > 1` projectiles they are spread in a small fan around the
 * aim direction.
 *
 * Nearest-enemy search is currently a linear scan; if enemy counts climb into
 * the thousands and this shows up in a profile, route it through the
 * `SpatialHashGrid` the collision system already builds.
 */
export class WeaponSystem extends System {
  private readonly aim = new Vector2();

  constructor(private readonly events: GameEventBus) {
    super();
  }

  update(world: World, time: Time): void {
    for (const entity of world.query(Player, Weapon, Transform)) {
      const weapon = world.get(entity, Weapon)!;
      weapon.timer -= time.scaledDelta;
      if (weapon.timer > 0) continue;

      const origin = world.get(entity, Transform)!.position;
      const player = world.get(entity, Player)!;

      const target = this.findNearestEnemy(world, origin);
      if (!target) {
        // Nothing to shoot: stay ready (don't burn a whole cooldown waiting),
        // but don't let the timer sink further so a target's arrival can't
        // trigger a burst of catch-up shots.
        weapon.timer = 0;
        continue;
      }
      // Carry the overshoot so the effective fire rate matches the cooldown.
      weapon.timer += weapon.cooldown;

      this.aim.set(target.x - origin.x, target.y - origin.y).normalize();
      const baseAngle = this.aim.angle();
      const formMul = world.get(entity, DraugrForm)?.damageMul ?? 1;
      const damage = weapon.damage * player.might * formMul;

      // Spread projectiles across a ~30° fan centred on the aim direction.
      const spread = Math.PI / 6;
      for (let i = 0; i < weapon.count; i++) {
        const t = weapon.count === 1 ? 0.5 : i / (weapon.count - 1);
        const angle = baseAngle + (t - 0.5) * spread;
        createProjectile(
          world,
          origin.x,
          origin.y,
          Math.cos(angle) * weapon.projectileSpeed,
          Math.sin(angle) * weapon.projectileSpeed,
          damage,
          weapon.pierce,
          weapon.projectileLifetime,
        );
      }

      this.events.emit("weaponFired", {
        x: origin.x,
        y: origin.y,
        count: weapon.count,
      });
    }
  }

  private findNearestEnemy(world: World, origin: Vector2): Vector2 | null {
    let nearest: Vector2 | null = null;
    let bestDistSq = Infinity;
    for (const entity of world.query(Enemy, Transform)) {
      const pos = world.get(entity, Transform)!.position;
      const distSq = origin.distanceToSq(pos);
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        nearest = pos;
      }
    }
    return nearest;
  }
}
