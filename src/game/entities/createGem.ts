import {
  type World,
  type Entity,
  Transform,
  Velocity,
  Sprite,
  CircleCollider,
  CollisionLayers,
} from "@engine";
import { ExperienceGem } from "../components/ExperienceGem";

/** Spawn an experience gem (dropped by a dead enemy). */
export function createGem(
  world: World,
  x: number,
  y: number,
  value: number,
): Entity {
  const gem = world.createEntity();
  world.add(gem, new Transform(x, y));
  world.add(gem, new Velocity());
  world.add(gem, new ExperienceGem(value));
  world.add(
    gem,
    new Sprite({ shape: "rect", width: 7, height: 7, color: "#46e0a0", layer: 3 }),
  );
  world.add(
    gem,
    new CircleCollider(5, CollisionLayers.Pickup, CollisionLayers.Player),
  );
  return gem;
}
