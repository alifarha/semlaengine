import { System, type World, type Time, Transform, Health } from "@engine";
import { Enemy } from "../components/Enemy";
import { Player } from "../components/Player";
import { createGem } from "../entities/createGem";
import type { GameEventBus } from "../events";

/**
 * Reaps entities whose health has reached zero. Dead enemies drop an experience
 * gem and emit `enemyKilled`; a dead player emits `playerDied` (the scene
 * listens to transition to a results screen).
 */
export class DeathSystem extends System {
  constructor(private readonly events: GameEventBus) {
    super();
  }

  update(world: World, _time: Time): void {
    for (const entity of world.query(Enemy, Health, Transform)) {
      const health = world.get(entity, Health)!;
      if (!health.isDead) continue;

      const enemy = world.get(entity, Enemy)!;
      const pos = world.get(entity, Transform)!.position;
      createGem(world, pos.x, pos.y, enemy.xpValue);
      this.events.emit("enemyKilled", { x: pos.x, y: pos.y, xpValue: enemy.xpValue });
      world.destroyEntity(entity);
    }

    const playerEntity = world.first(Player, Health);
    if (playerEntity >= 0 && world.get(playerEntity, Health)!.isDead) {
      this.events.emit("playerDied", undefined);
      world.destroyEntity(playerEntity);
    }
  }
}
