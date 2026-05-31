import {
  type World,
  type Entity,
  Transform,
  Velocity,
  Sprite,
  Health,
  CircleCollider,
  CollisionLayers,
} from "@engine";
import { Enemy } from "../components/Enemy";
import { Boss, type BossRole } from "../components/Boss";

interface BossDef {
  name: string;
  health: number;
  speed: number;
  contactDamage: number;
  radius: number;
  color: string;
}

const BOSS_DEFS: Record<BossRole, BossDef> = {
  // Sköll chases the sun — aggressive, golden-red, the pursuer.
  skoll: { name: "Sköll", health: 900, speed: 70, contactDamage: 22, radius: 21, color: "#d98a3a" },
  // Hati chases the moon — cold blue-grey, the flanker.
  hati: { name: "Hati", health: 800, speed: 64, contactDamage: 20, radius: 20, color: "#6f86b0" },
};

/** Spawn one wolf of the Sköll & Hati pair. */
export function createBoss(
  world: World,
  role: BossRole,
  x: number,
  y: number,
): Entity {
  const def = BOSS_DEFS[role];
  const boss = world.createEntity();
  world.add(boss, new Transform(x, y));
  world.add(boss, new Velocity());
  // High sál reward; behaves as an enemy for collision/damage/death systems.
  world.add(boss, new Enemy(def.speed, def.contactDamage, 120));
  world.add(boss, new Health(def.health));
  world.add(
    boss,
    new Sprite({
      shape: "circle",
      width: def.radius * 2,
      height: def.radius * 2,
      color: def.color,
      layer: 6,
    }),
  );
  world.add(
    boss,
    new CircleCollider(
      def.radius,
      CollisionLayers.Enemy,
      CollisionLayers.Player | CollisionLayers.PlayerProjectile,
    ),
  );
  world.add(boss, new Boss(def.name, role));
  return boss;
}
