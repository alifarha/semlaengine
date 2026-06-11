/**
 * Exercises CollisionSystem edge cases with no DOM:
 *   - a piercing projectile damages each enemy once (no re-hits while overlapping)
 *   - dead-but-unreaped enemies neither soak projectiles nor deal contact damage
 *   - grid queries are padded by the largest enemy radius, so boss-sized
 *     colliders near a cell boundary are still hit
 */
import { World, Time, Transform, Health, CircleCollider, type Entity } from "@engine";
import { createGameEventBus } from "@game";
import { createPlayer } from "@game/entities/createPlayer";
import { createProjectile } from "@game/entities/createProjectile";
import { CollisionSystem } from "@game/systems/CollisionSystem";
import { Enemy } from "@game/components/Enemy";
import { Player } from "@game/components/Player";
import { Projectile } from "@game/components/Projectile";

let failures = 0;
function check(label: string, cond: boolean): void {
  if (!cond) {
    failures++;
    console.error(`  ✗ ${label}`);
  } else {
    console.log(`  ✓ ${label}`);
  }
}

function makeEnemy(world: World, x: number, y: number, hp: number, radius = 10): Entity {
  const e = world.createEntity();
  world.add(e, new Transform(x, y));
  world.add(e, new Enemy(45, 8, 1));
  world.add(e, new Health(hp));
  world.add(e, new CircleCollider(radius));
  return e;
}

const time = new Time();

// --- Pierce: one hit per enemy, even across several overlapping steps ---
{
  const world = new World();
  const bus = createGameEventBus();
  const sys = new CollisionSystem(bus);

  const enemy = makeEnemy(world, 0, 0, 100);
  createProjectile(world, 0, 0, 0, 0, 10, 3, 5); // stationary, pierce 3

  sys.update(world, time);
  world.flushDestroyed();
  check("first overlap damages the enemy", world.get(enemy, Health)!.current === 90);

  sys.update(world, time);
  sys.update(world, time);
  check(
    "still-overlapping projectile doesn't re-hit",
    world.get(enemy, Health)!.current === 90,
  );

  const second = makeEnemy(world, 5, 0, 100);
  sys.update(world, time);
  check("remaining pierce hits a new enemy", world.get(second, Health)!.current === 90);
}

// --- Dead enemies are inert until reaped ---
{
  const world = new World();
  const bus = createGameEventBus();
  const sys = new CollisionSystem(bus);

  const player = createPlayer(world, 0, 0);
  const corpse = makeEnemy(world, 10, 0, 50);
  world.get(corpse, Health)!.current = 0; // killed earlier this frame
  const live = makeEnemy(world, -10, 0, 50);

  createProjectile(world, 10, 0, 0, 0, 10, 1, 5); // overlaps only the corpse

  sys.update(world, time);
  check("dead enemy doesn't soak projectiles", world.get(corpse, Health)!.current === 0);
  world.flushDestroyed();
  check(
    "projectile isn't spent on the corpse",
    world.queryArray(Projectile).length === 1,
  );
  check(
    "dead enemy deals no contact damage; live one does",
    world.get(player, Health)!.current === 100 - world.get(live, Enemy)!.contactDamage,
  );
  check("player query intact", world.first(Player) === player);
}

// --- Boss-sized colliders near a cell boundary are still found ---
{
  const world = new World();
  const bus = createGameEventBus();
  const sys = new CollisionSystem(bus);

  // Grid cell size is 48. Projectile (radius 4) at x=74 sits in cell 1;
  // a radius-21 boss centred at x=98 sits in cell 2, 24 units away — they
  // overlap (25 reach), but a fixed +16 query padding would never scan cell 2.
  const boss = makeEnemy(world, 98, 24, 200, 21);
  createProjectile(world, 74, 24, 0, 0, 10, 1, 5);

  sys.update(world, time);
  check(
    "large collider across a cell boundary is hit",
    world.get(boss, Health)!.current === 190,
  );
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll collision checks passed");
