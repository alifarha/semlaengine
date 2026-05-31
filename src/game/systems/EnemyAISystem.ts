import { System, type World, type Time, Transform, Velocity } from "@engine";
import { Player } from "../components/Player";
import { Enemy } from "../components/Enemy";

/**
 * Classic survivor AI: every enemy walks straight at the player. Simple, cheap,
 * and exactly the behaviour that makes the swarm menacing. Steering/avoidance
 * could be layered on later, but direct pursuit scales to thousands of enemies.
 */
export class EnemyAISystem extends System {
  update(world: World, _time: Time): void {
    const playerEntity = world.first(Player, Transform);
    if (playerEntity < 0) return;
    const target = world.get(playerEntity, Transform)!.position;

    for (const entity of world.query(Enemy, Transform, Velocity)) {
      const enemy = world.get(entity, Enemy)!;
      const pos = world.get(entity, Transform)!.position;
      const velocity = world.get(entity, Velocity)!;

      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const len = Math.hypot(dx, dy) || 1;
      velocity.value.set((dx / len) * enemy.speed, (dy / len) * enemy.speed);
    }
  }
}
