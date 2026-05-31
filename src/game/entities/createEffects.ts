import { type World, Transform, Sprite, Transient, MathUtils } from "@engine";
import { Particle } from "../components/Particle";
import { FloatingText } from "../components/FloatingText";

export interface BurstOptions {
  count?: number;
  color?: string;
  /** Peak outward speed in world units/sec. */
  speed?: number;
  size?: number;
  life?: number;
}

/** Spawn a radial burst of particles (e.g. on enemy death). */
export function spawnParticleBurst(
  world: World,
  x: number,
  y: number,
  opts: BurstOptions = {},
): void {
  const count = opts.count ?? 6;
  const color = opts.color ?? "#ffffff";
  const speed = opts.speed ?? 120;
  const size = opts.size ?? 4;
  const life = opts.life ?? 0.4;

  for (let i = 0; i < count; i++) {
    const angle = MathUtils.randRange(0, MathUtils.TAU);
    const spd = MathUtils.randRange(speed * 0.35, speed);
    const e = world.createEntity();
    world.add(e, new Transform(x, y));
    world.add(
      e,
      new Sprite({ shape: "circle", width: size, height: size, color, layer: 7 }),
    );
    world.add(e, new Particle(Math.cos(angle) * spd, Math.sin(angle) * spd, life));
    world.add(e, new Transient());
  }
}

/** Spawn a piece of world-space floating text (damage numbers, popups). */
export function spawnFloatingText(
  world: World,
  x: number,
  y: number,
  text: string,
  color = "#ffffff",
  size = 12,
  life = 0.7,
): void {
  const e = world.createEntity();
  // Jitter a touch so stacked numbers don't perfectly overlap.
  world.add(e, new Transform(x + MathUtils.randRange(-4, 4), y - 6));
  world.add(e, new FloatingText(text, color, life, 34, size));
  world.add(e, new Transient());
}
