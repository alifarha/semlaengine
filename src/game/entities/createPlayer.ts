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
import { Player } from "../components/Player";
import { PlayerProgress } from "../components/PlayerProgress";
import { STARTING_WEAPON } from "../data/weapons";

/** Spawn the player at a world position with its starting weapon. */
export function createPlayer(world: World, x: number, y: number): Entity {
  const player = world.createEntity();
  world.add(player, new Transform(x, y));
  world.add(player, new Velocity());
  world.add(player, new Player());
  world.add(player, new PlayerProgress());
  world.add(player, new Health(100, 0.5));
  world.add(player, STARTING_WEAPON.create());
  world.add(
    player,
    new Sprite({ shape: "circle", width: 18, height: 18, color: "#ffd166", layer: 10 }),
  );
  world.add(
    player,
    new CircleCollider(9, CollisionLayers.Player, CollisionLayers.Enemy),
  );
  return player;
}
