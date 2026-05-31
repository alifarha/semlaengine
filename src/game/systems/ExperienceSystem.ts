import {
  System,
  type World,
  type Time,
  type Entity,
  Transform,
  Velocity,
  CircleCollider,
  MathUtils,
} from "@engine";
import { Player } from "../components/Player";
import { PlayerProgress } from "../components/PlayerProgress";
import { ExperienceGem } from "../components/ExperienceGem";
import { UPGRADES } from "../data/upgrades";
import type { GameEventBus } from "../events";

/**
 * Drives the core progression loop: gems within magnet range fly to the player,
 * are collected on contact, grant XP, and trigger level-ups.
 *
 * On level-up the scaffold auto-applies a random upgrade and emits
 * `playerLeveledUp`. TODO: pause the simulation and present the player a choice
 * of three upgrades (the signature meta-decision of the genre) instead of
 * picking automatically.
 */
export class ExperienceSystem extends System {
  constructor(private readonly events: GameEventBus) {
    super();
  }

  update(world: World, _time: Time): void {
    const playerEntity = world.first(Player, Transform, PlayerProgress);
    if (playerEntity < 0) return;

    const player = world.get(playerEntity, Player)!;
    const playerPos = world.get(playerEntity, Transform)!.position;
    const playerRadius = world.get(playerEntity, CircleCollider)?.radius ?? 9;
    const progress = world.get(playerEntity, PlayerProgress)!;

    const magnetSq = player.magnetRadius * player.magnetRadius;

    for (const gem of world.query(ExperienceGem, Transform, Velocity)) {
      const gemComp = world.get(gem, ExperienceGem)!;
      const gemPos = world.get(gem, Transform)!.position;
      const velocity = world.get(gem, Velocity)!;
      const distSq = gemPos.distanceToSq(playerPos);

      // Collected?
      const pickupReach = playerRadius + 6;
      if (distSq <= pickupReach * pickupReach) {
        this.collect(world, playerEntity, progress, gemComp.value);
        world.destroyEntity(gem);
        continue;
      }

      // Within magnet range: accelerate toward the player.
      if (gemComp.attracted || distSq <= magnetSq) {
        gemComp.attracted = true;
        const dx = playerPos.x - gemPos.x;
        const dy = playerPos.y - gemPos.y;
        const len = Math.hypot(dx, dy) || 1;
        const speed = 320;
        velocity.value.set((dx / len) * speed, (dy / len) * speed);
      } else {
        velocity.value.set(0, 0);
      }
    }
  }

  private collect(
    world: World,
    playerEntity: Entity,
    progress: PlayerProgress,
    value: number,
  ): void {
    this.events.emit("gemCollected", { value });
    progress.xp += value;

    while (progress.xp >= progress.xpToNext) {
      progress.xp -= progress.xpToNext;
      progress.level += 1;
      progress.xpToNext = PlayerProgress.xpForLevel(progress.level);

      // TODO: replace auto-pick with a player-facing upgrade selection UI.
      MathUtils.randChoice(UPGRADES).apply(world, playerEntity);
      this.events.emit("playerLeveledUp", { level: progress.level });
    }
  }
}
