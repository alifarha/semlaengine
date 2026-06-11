import {
  System,
  type World,
  type Time,
  type Entity,
  type EngineContext,
  Transform,
  Sprite,
} from "@engine";
import { Player } from "../components/Player";
import { Particle } from "../components/Particle";
import { FloatingText } from "../components/FloatingText";
import { Flash } from "../components/Flash";
import { spawnParticleBurst, spawnFloatingText } from "../entities/createEffects";
import type { GameEventBus } from "../events";

// Soft caps so a frantic swarm can't flood the world with effect entities.
const MAX_PARTICLES = 500;
const MAX_TEXTS = 80;

/**
 * Turns gameplay events into "juice": hit flashes, floating damage numbers,
 * particle bursts and screen shake, plus procedural SFX. It also advances and
 * reaps those transient effect entities each step.
 *
 * Everything here is event-driven and decoupled — removing this single system
 * strips all juice/audio without touching combat logic.
 */
export class EffectsSystem extends System {
  private particleCount = 0;
  private textCount = 0;

  constructor(
    private readonly events: GameEventBus,
    private readonly ctx: EngineContext,
  ) {
    super();
  }

  init(world: World): void {
    const { audio } = this.ctx;
    const camera = this.ctx.renderer.camera;

    this.events.on("weaponFired", () => {
      audio.tone({ freq: 620, slideTo: 760, duration: 0.05, type: "square", gain: 0.12 });
    });

    this.events.on("enemyDamaged", ({ entity, x, y, amount, killed }) => {
      // Flash the enemy and pop a damage number.
      if (world.isAlive(entity)) world.add(entity, new Flash(0.07, "#ffffff"));
      if (this.textCount < MAX_TEXTS) {
        spawnFloatingText(world, x, y, String(Math.round(amount)), "#ffe08a", 11, 0.55);
      }
      if (!killed) {
        audio.tone({ freq: 240, duration: 0.04, type: "triangle", gain: 0.1 });
      }
    });

    this.events.on("enemyKilled", ({ x, y }) => {
      if (this.particleCount < MAX_PARTICLES) {
        spawnParticleBurst(world, x, y, {
          count: 7,
          color: "#c0577f",
          speed: 150,
          life: 0.45,
        });
      }
      camera.addTrauma(0.14);
      audio.noise(0.16, 0.18, 1400);
      audio.tone({ freq: 180, slideTo: 70, duration: 0.16, type: "sawtooth", gain: 0.12 });
    });

    this.events.on("gemCollected", () => {
      audio.tone({ freq: 880, slideTo: 1320, duration: 0.07, type: "sine", gain: 0.1 });
    });

    this.events.on("playerDamaged", ({ amount }) => {
      const player = world.first(Player, Transform);
      if (player >= 0) {
        const pos = world.get(player, Transform)!.position;
        world.add(player, new Flash(0.12, "#ff5470"));
        spawnParticleBurst(world, pos.x, pos.y, {
          count: 8,
          color: "#ff5470",
          speed: 140,
          life: 0.5,
        });
        spawnFloatingText(world, pos.x, pos.y, `-${Math.round(amount)}`, "#ff5470", 14, 0.8);
      }
      camera.addTrauma(0.5);
      audio.tone({ freq: 150, slideTo: 60, duration: 0.18, type: "sawtooth", gain: 0.22 });
    });

    this.events.on("playerLeveledUp", () => {
      const player = world.first(Player, Transform);
      if (player >= 0) {
        const pos = world.get(player, Transform)!.position;
        spawnFloatingText(world, pos.x, pos.y - 14, "LEVEL UP!", "#46c0ff", 16, 1.0);
      }
      camera.addTrauma(0.2);
      audio.tone({ freq: 523, duration: 0.09, type: "square", gain: 0.16 });
      audio.tone({ freq: 784, duration: 0.12, type: "square", gain: 0.16 });
    });

    this.events.on("playerDied", () => {
      camera.addTrauma(1);
      audio.tone({ freq: 320, slideTo: 50, duration: 0.7, type: "sawtooth", gain: 0.3 });
    });

    this.events.on("waveSpawned", () => {
      camera.addTrauma(0.25);
      audio.tone({ freq: 130, slideTo: 95, duration: 0.35, type: "sawtooth", gain: 0.18 });
    });

    this.events.on("bossSpawned", ({ name }) => {
      const player = world.first(Player, Transform);
      if (player >= 0) {
        const pos = world.get(player, Transform)!.position;
        spawnFloatingText(world, pos.x, pos.y - 28, name.toUpperCase(), "#c0392b", 18, 1.8);
      }
      camera.addTrauma(0.6);
      audio.tone({ freq: 90, slideTo: 58, duration: 0.6, type: "sawtooth", gain: 0.28 });
    });

    this.events.on("bossDefeated", () => {
      const player = world.first(Player, Transform);
      if (player >= 0) {
        const pos = world.get(player, Transform)!.position;
        spawnFloatingText(world, pos.x, pos.y - 28, "THE WOLVES FALL", "#d4af6a", 18, 2.0);
      }
      camera.addTrauma(0.5);
      audio.tone({ freq: 300, slideTo: 520, duration: 0.4, type: "square", gain: 0.2 });
    });

    this.events.on("draugrFormChanged", ({ state, ascending }) => {
      if (!ascending) return; // only celebrate growing, not waning
      const player = world.first(Player, Transform);
      if (player >= 0) {
        const pos = world.get(player, Transform)!.position;
        spawnFloatingText(world, pos.x, pos.y - 16, state.toUpperCase(), "#8fb6ff", 14, 0.9);
        spawnParticleBurst(world, pos.x, pos.y, {
          count: 10,
          color: "#8fb6ff",
          speed: 130,
          life: 0.5,
        });
      }
      camera.addTrauma(state === "Barrow-King" ? 0.5 : 0.2);
      audio.tone({ freq: 392, slideTo: 588, duration: 0.18, type: "sawtooth", gain: 0.16 });
    });
  }

  update(world: World, time: Time): void {
    const dt = time.scaledDelta;
    // Screen shake decays on unscaled time so slow-mo doesn't prolong it.
    this.ctx.renderer.camera.updateShake(time.delta);

    this.updateParticles(world, dt);
    this.updateFloatingText(world, dt);
    this.updateFlashes(world, time.delta);
  }

  private updateParticles(world: World, dt: number): void {
    let count = 0;
    for (const entity of world.query(Particle, Transform, Sprite)) {
      count++;
      const p = world.get(entity, Particle)!;
      p.age += dt;
      if (p.age >= p.life) {
        world.destroyEntity(entity);
        continue;
      }
      const transform = world.get(entity, Transform)!;
      transform.savePrevious();
      transform.position.x += p.vx * dt;
      transform.position.y += p.vy * dt;
      // Friction slows the particle over its life.
      const damp = Math.max(0, 1 - p.friction * dt);
      p.vx *= damp;
      p.vy *= damp;
      // Fade out toward end of life.
      world.get(entity, Sprite)!.alpha = 1 - p.age / p.life;
    }
    this.particleCount = count;
  }

  private updateFloatingText(world: World, dt: number): void {
    let count = 0;
    for (const entity of world.query(FloatingText, Transform)) {
      count++;
      const ft = world.get(entity, FloatingText)!;
      ft.age += dt;
      if (ft.age >= ft.life) {
        world.destroyEntity(entity);
        continue;
      }
      const transform = world.get(entity, Transform)!;
      transform.savePrevious();
      transform.position.y -= ft.riseSpeed * dt;
    }
    this.textCount = count;
  }

  private updateFlashes(world: World, dt: number): void {
    const expired: Entity[] = [];
    for (const entity of world.query(Flash)) {
      const flash = world.get(entity, Flash)!;
      flash.remaining -= dt;
      if (flash.remaining <= 0) expired.push(entity);
    }
    for (const entity of expired) world.remove(entity, Flash);
  }
}
