import { type ComponentRegistry } from "@engine";
import { Player } from "./components/Player";
import { Enemy } from "./components/Enemy";
import { Weapon } from "./components/Weapon";
import { Projectile } from "./components/Projectile";
import { ExperienceGem } from "./components/ExperienceGem";
import { PlayerProgress } from "./components/PlayerProgress";
import { DraugrForm } from "./components/DraugrForm";
import { Boss, type BossRole } from "./components/Boss";

function num(data: unknown, key: string, fallback = 0): number {
  const value = (data as Record<string, unknown>)[key];
  return typeof value === "number" ? value : fallback;
}

function bool(data: unknown, key: string, fallback = false): boolean {
  const value = (data as Record<string, unknown>)[key];
  return typeof value === "boolean" ? value : fallback;
}

/**
 * Register codecs for the game's components so worlds can be saved/loaded.
 * Pair with `registerBuiltinComponents` for the engine's components.
 */
export function registerGameComponents(registry: ComponentRegistry): void {
  registry.register({
    name: "Player",
    type: Player,
    serialize: (p) => ({
      moveSpeed: p.moveSpeed,
      magnetRadius: p.magnetRadius,
      might: p.might,
    }),
    deserialize: (d) => {
      const p = new Player();
      p.moveSpeed = num(d, "moveSpeed", p.moveSpeed);
      p.magnetRadius = num(d, "magnetRadius", p.magnetRadius);
      p.might = num(d, "might", p.might);
      return p;
    },
  });

  registry.register({
    name: "Enemy",
    type: Enemy,
    serialize: (e) => ({
      speed: e.speed,
      contactDamage: e.contactDamage,
      xpValue: e.xpValue,
    }),
    deserialize: (d) =>
      new Enemy(num(d, "speed", 45), num(d, "contactDamage", 8), num(d, "xpValue", 1)),
  });

  registry.register({
    name: "Weapon",
    type: Weapon,
    serialize: (w) => ({
      cooldown: w.cooldown,
      timer: w.timer,
      damage: w.damage,
      projectileSpeed: w.projectileSpeed,
      projectileLifetime: w.projectileLifetime,
      pierce: w.pierce,
      count: w.count,
    }),
    deserialize: (d) => {
      const w = new Weapon(d as Partial<Weapon>);
      w.timer = num(d, "timer");
      return w;
    },
  });

  registry.register({
    name: "Projectile",
    type: Projectile,
    serialize: (p) => ({ damage: p.damage, pierceRemaining: p.pierceRemaining }),
    deserialize: (d) => new Projectile(num(d, "damage"), num(d, "pierceRemaining", 1)),
  });

  registry.register({
    name: "Boss",
    type: Boss,
    serialize: (b) => ({ name: b.name, role: b.role, enraged: b.enraged }),
    deserialize: (d) => {
      const data = d as Record<string, unknown>;
      const b = new Boss(
        typeof data.name === "string" ? data.name : "Boss",
        (data.role === "hati" ? "hati" : "skoll") as BossRole,
      );
      b.enraged = bool(d, "enraged");
      return b;
    },
  });

  registry.register({
    name: "ExperienceGem",
    type: ExperienceGem,
    serialize: (g) => ({ value: g.value, attracted: g.attracted }),
    deserialize: (d) => {
      const gem = new ExperienceGem(num(d, "value", 1));
      gem.attracted = bool(d, "attracted");
      return gem;
    },
  });

  registry.register({
    name: "DraugrForm",
    type: DraugrForm,
    // Only fullness is persisted; state/multipliers are recomputed on the next
    // form-system tick from the thresholds.
    serialize: (f) => ({ fullness: f.fullness }),
    deserialize: (d) => {
      const f = new DraugrForm();
      f.fullness = num(d, "fullness", 0.4);
      return f;
    },
  });

  registry.register({
    name: "PlayerProgress",
    type: PlayerProgress,
    serialize: (p) => ({
      level: p.level,
      xp: p.xp,
      xpToNext: p.xpToNext,
      kills: p.kills,
    }),
    deserialize: (d) => {
      const p = new PlayerProgress();
      p.level = num(d, "level", 1);
      p.xp = num(d, "xp");
      p.xpToNext = num(d, "xpToNext", 5);
      p.kills = num(d, "kills");
      return p;
    },
  });
}
