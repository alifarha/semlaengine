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
import type { EnemyDef } from "../data/enemies";

/** Stat scaling applied to elite spawns (see EnemySpawnSystem). */
export const ELITE = {
  health: 4,
  speed: 1.15,
  contactDamage: 1.5,
  xpValue: 5,
  radius: 1.4,
  color: "#e0b341",
} as const;

/** Spawn an enemy from a data definition at a world position. */
export function createEnemy(
  world: World,
  def: EnemyDef,
  x: number,
  y: number,
  options: { elite?: boolean } = {},
): Entity {
  const elite = options.elite ?? false;
  const radius = elite ? def.radius * ELITE.radius : def.radius;

  const enemy = world.createEntity();
  world.add(enemy, new Transform(x, y));
  world.add(enemy, new Velocity());
  world.add(
    enemy,
    new Enemy(
      elite ? def.speed * ELITE.speed : def.speed,
      elite ? Math.round(def.contactDamage * ELITE.contactDamage) : def.contactDamage,
      elite ? def.xpValue * ELITE.xpValue : def.xpValue,
    ),
  );
  world.add(enemy, new Health(elite ? def.health * ELITE.health : def.health));
  world.add(
    enemy,
    new Sprite({
      shape: "circle",
      width: radius * 2,
      height: radius * 2,
      // Elites are gold-clad so they read instantly amid the swarm.
      color: elite ? ELITE.color : def.color,
      layer: 5,
    }),
  );
  world.add(
    enemy,
    new CircleCollider(
      radius,
      CollisionLayers.Enemy,
      CollisionLayers.Player | CollisionLayers.PlayerProjectile,
    ),
  );
  return enemy;
}
