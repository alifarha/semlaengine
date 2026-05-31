import {
  System,
  type World,
  type Time,
  type Entity,
  NULL_ENTITY,
  Transform,
  Velocity,
  Health,
  Sprite,
  MathUtils,
} from "@engine";
import { Player } from "../components/Player";
import { Enemy } from "../components/Enemy";
import { Boss } from "../components/Boss";
import { createBoss } from "../entities/createBoss";
import { spawnFloatingText } from "../entities/createEffects";
import type { GameEventBus } from "../events";

/**
 * Scripts the Sköll & Hati encounter (GDD §07).
 *
 * The two wolves spawn together once the run reaches `spawnTime`. Sköll pursues
 * the player directly (handled by the normal enemy AI), while this system steers
 * Hati on a flanking arc. When Sköll falls, Hati enrages — faster, fiercer, and
 * charging straight in. When both are down, the encounter resolves.
 *
 * Bosses are ordinary enemies to the combat systems (collision/damage/death),
 * so this system only adds the bespoke spawn, steering and phase logic.
 */
export class BossSystem extends System {
  private spawned = false;
  private defeated = false;
  private skollHandled = false;
  private skoll: Entity = NULL_ENTITY;
  private hati: Entity = NULL_ENTITY;

  constructor(
    private readonly events: GameEventBus,
    /** Run time (seconds) at which the wolves appear. */
    private readonly spawnTime = 60,
  ) {
    super();
  }

  update(world: World, time: Time): void {
    const player = world.first(Player, Transform);
    if (player < 0) return;
    const playerPos = world.get(player, Transform)!.position;

    if (!this.spawned) {
      if (time.elapsed < this.spawnTime) return;
      this.spawnPair(world, playerPos.x, playerPos.y);
      return;
    }
    if (this.defeated) return;

    const skollGone = this.isGone(world, this.skoll);
    const hatiGone = this.isGone(world, this.hati);

    if (!hatiGone) this.steerHati(world, playerPos.x, playerPos.y);

    if (skollGone && !this.skollHandled) {
      this.skollHandled = true;
      if (!hatiGone) this.enrageHati(world);
    }

    if (skollGone && hatiGone) {
      this.defeated = true;
      this.events.emit("bossDefeated", { name: "Sköll & Hati" });
    }
  }

  private spawnPair(world: World, px: number, py: number): void {
    const angle = MathUtils.randRange(0, MathUtils.TAU);
    const dist = 360;
    const cx = Math.cos(angle) * dist;
    const cy = Math.sin(angle) * dist;
    // Spawn the wolves on opposite sides of the player.
    this.skoll = createBoss(world, "skoll", px + cx, py + cy);
    this.hati = createBoss(world, "hati", px - cx, py - cy);
    this.spawned = true;
    this.events.emit("bossSpawned", { name: "Sköll & Hati" });
  }

  /** Steer Hati on a flanking arc (or a straight charge once enraged). */
  private steerHati(world: World, px: number, py: number): void {
    const pos = world.get(this.hati, Transform)!.position;
    const velocity = world.get(this.hati, Velocity)!.value;
    const speed = world.get(this.hati, Enemy)!.speed;
    const enraged = world.get(this.hati, Boss)?.enraged ?? false;

    let dx = px - pos.x;
    let dy = py - pos.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;

    if (enraged) {
      velocity.set(dx * speed, dy * speed); // charge
      return;
    }
    // Blend approach with a perpendicular component to circle the player.
    const ex = dx * 0.5 - dy * 0.85;
    const ey = dy * 0.5 + dx * 0.85;
    const el = Math.hypot(ex, ey) || 1;
    velocity.set((ex / el) * speed, (ey / el) * speed);
  }

  private enrageHati(world: World): void {
    const enemy = world.get(this.hati, Enemy);
    const boss = world.get(this.hati, Boss);
    const sprite = world.get(this.hati, Sprite);
    if (enemy) {
      enemy.speed *= 1.6;
      enemy.contactDamage = Math.round(enemy.contactDamage * 1.5);
    }
    if (boss) boss.enraged = true;
    if (sprite) sprite.color = "#c0392b";
    const pos = world.get(this.hati, Transform)?.position;
    if (pos) spawnFloatingText(world, pos.x, pos.y - 22, "HATI RAGES!", "#c0392b", 16, 1.1);
  }

  /** A boss is "gone" when it has been reaped or its health has hit zero. */
  private isGone(world: World, entity: Entity): boolean {
    if (entity === NULL_ENTITY || !world.isAlive(entity)) return true;
    const health = world.get(entity, Health);
    return !!health && health.current <= 0;
  }
}
