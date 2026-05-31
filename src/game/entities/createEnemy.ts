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

/** Spawn an enemy from a data definition at a world position. */
export function createEnemy(
  world: World,
  def: EnemyDef,
  x: number,
  y: number,
): Entity {
  const enemy = world.createEntity();
  world.add(enemy, new Transform(x, y));
  world.add(enemy, new Velocity());
  world.add(enemy, new Enemy(def.speed, def.contactDamage, def.xpValue));
  world.add(enemy, new Health(def.health));
  world.add(
    enemy,
    new Sprite({
      shape: "circle",
      width: def.radius * 2,
      height: def.radius * 2,
      color: def.color,
      layer: 5,
    }),
  );
  world.add(
    enemy,
    new CircleCollider(
      def.radius,
      CollisionLayers.Enemy,
      CollisionLayers.Player | CollisionLayers.PlayerProjectile,
    ),
  );
  return enemy;
}
