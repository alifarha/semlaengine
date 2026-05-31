import {
  type World,
  type Entity,
  Transform,
  Velocity,
  Sprite,
  Lifetime,
  CircleCollider,
  CollisionLayers,
} from "@engine";
import { Projectile } from "../components/Projectile";

/** Spawn a player projectile travelling with the given velocity. */
export function createProjectile(
  world: World,
  x: number,
  y: number,
  vx: number,
  vy: number,
  damage: number,
  pierce: number,
  lifetime: number,
): Entity {
  const proj = world.createEntity();
  world.add(proj, new Transform(x, y));
  const velocity = new Velocity(vx, vy);
  world.add(proj, velocity);
  world.add(proj, new Projectile(damage, pierce));
  world.add(proj, new Lifetime(lifetime));
  world.add(
    proj,
    new Sprite({ shape: "circle", width: 8, height: 8, color: "#7ad7ff", layer: 8 }),
  );
  world.add(
    proj,
    new CircleCollider(4, CollisionLayers.PlayerProjectile, CollisionLayers.Enemy),
  );
  return proj;
}
