/**
 * Drives the Sköll & Hati BossSystem through its full arc with no DOM:
 * spawn -> Hati flanks -> Sköll dies -> Hati enrages -> both down -> defeated.
 */
import { World, Time, Health, Velocity } from "@engine";
import { createGameEventBus } from "@game";
import { createPlayer } from "@game/entities/createPlayer";
import { BossSystem } from "@game/systems/BossSystem";
import { Boss } from "@game/components/Boss";
import { Enemy } from "@game/components/Enemy";

let failures = 0;
function check(label: string, cond: boolean): void {
  if (!cond) {
    failures++;
    console.error(`  ✗ ${label}`);
  } else {
    console.log(`  ✓ ${label}`);
  }
}

const bus = createGameEventBus();
let spawnedName: string | null = null;
let defeatedName: string | null = null;
bus.on("bossSpawned", (e) => (spawnedName = e.name));
bus.on("bossDefeated", (e) => (defeatedName = e.name));

const world = new World();
createPlayer(world, 0, 0);
const sys = new BossSystem(bus, 1); // spawn at t = 1s
const time = new Time();

// Before spawn time: nothing happens.
time.elapsed = 0.5;
sys.update(world, time);
check("no bosses before spawn time", world.queryArray(Boss).length === 0);

// At spawn time: the pair appears and the event fires.
time.elapsed = 1.0;
sys.update(world, time);
const bosses = world.queryArray(Boss);
check("two bosses spawned", bosses.length === 2);
check("bossSpawned emitted", spawnedName === "Sköll & Hati");

const skoll = bosses.find((e) => world.get(e, Boss)!.role === "skoll")!;
const hati = bosses.find((e) => world.get(e, Boss)!.role === "hati")!;
check("Sköll carries Enemy + Health", !!world.get(skoll, Enemy) && !!world.get(skoll, Health));
check("boss drops big sál", world.get(skoll, Enemy)!.xpValue === 120);

// Hati gets a non-zero flanking velocity.
const hatiSpeed0 = world.get(hati, Enemy)!.speed;
sys.update(world, time);
const hvel = world.get(hati, Velocity)!.value;
check("Hati flanks (velocity set)", Math.hypot(hvel.x, hvel.y) > 0);

// Sköll falls -> Hati enrages (faster, marked).
world.get(skoll, Health)!.current = 0;
sys.update(world, time);
check("Hati enrages when Sköll dies", world.get(hati, Boss)!.enraged === true);
check("enraged Hati is faster", world.get(hati, Enemy)!.speed > hatiSpeed0);
check("not defeated while Hati lives", defeatedName === null);

// Hati falls too -> encounter resolves.
world.get(hati, Health)!.current = 0;
sys.update(world, time);
check("bossDefeated emitted when both fall", defeatedName === "Sköll & Hati");

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll boss checks passed");
