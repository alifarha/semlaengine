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
import { DraugrForm } from "../components/DraugrForm";
import { WeaponInventory } from "../components/WeaponInventory";
import { STARTING_WEAPON, weaponFromDef } from "../data/weapons";
import { metaBonuses } from "../meta";

/**
 * Spawn the player at a world position with its starting weapon. Permanent
 * Barrow upgrades (meta-progression) are baked into the starting stats here.
 */
export function createPlayer(world: World, x: number, y: number): Entity {
  const meta = metaBonuses();

  const player = world.createEntity();
  world.add(player, new Transform(x, y));
  world.add(player, new Velocity());
  const stats = new Player();
  stats.might *= meta.mightMul;
  stats.moveSpeed *= meta.speedMul;
  stats.magnetRadius *= meta.magnetMul;
  world.add(player, stats);
  world.add(player, new PlayerProgress());
  world.add(player, new DraugrForm());
  world.add(player, new Health(100 + meta.vigour, 0.5));
  world.add(player, new WeaponInventory(weaponFromDef(STARTING_WEAPON)));
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
