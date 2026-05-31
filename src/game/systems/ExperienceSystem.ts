import {
  System,
  type World,
  type Time,
  Transform,
  Velocity,
  CircleCollider,
} from "@engine";
import { Player } from "../components/Player";
import { PlayerProgress } from "../components/PlayerProgress";
import { ExperienceGem } from "../components/ExperienceGem";
import { DraugrForm } from "../components/DraugrForm";
import type { GameEventBus } from "../events";

/**
 * Drives the core progression loop: sál orbs within magnet range fly to the
 * player, are collected on contact, grant sál (XP), and trigger level-ups.
 *
 * Each level-up emits `playerLeveledUp`; the scene catches it, pauses the
 * simulation and presents the player a Kenning (rune) choice. This system does
 * not apply the upgrade itself — the chosen rune does.
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

    // Gorged/Barrow-King forms widen the sál-drawing aura.
    const auraMul = world.get(playerEntity, DraugrForm)?.auraMul ?? 1;
    const magnet = player.magnetRadius * auraMul;
    const magnetSq = magnet * magnet;

    for (const gem of world.query(ExperienceGem, Transform, Velocity)) {
      const gemComp = world.get(gem, ExperienceGem)!;
      const gemPos = world.get(gem, Transform)!.position;
      const velocity = world.get(gem, Velocity)!;
      const distSq = gemPos.distanceToSq(playerPos);

      // Collected?
      const pickupReach = playerRadius + 6;
      if (distSq <= pickupReach * pickupReach) {
        this.collect(progress, gemComp.value);
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

  private collect(progress: PlayerProgress, value: number): void {
    this.events.emit("gemCollected", { value });
    progress.xp += value;

    while (progress.xp >= progress.xpToNext) {
      progress.xp -= progress.xpToNext;
      progress.level += 1;
      progress.xpToNext = PlayerProgress.xpForLevel(progress.level);

      // The Kenning choice (rune selection) is presented by the scene, which
      // pauses the simulation until the player picks. Each level emits an event
      // so multiple level-ups queue multiple choices.
      this.events.emit("playerLeveledUp", { level: progress.level });
    }
  }
}
