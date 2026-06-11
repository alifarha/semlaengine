/**
 * Wave-scripting tests: scripted waves fire once at their time, in formation,
 * with elites where flagged. DOM-free.
 */
import { World, Time, Health, Transform } from "@engine";
import { WAVES, ENEMIES, createGameEventBus } from "@game";
import { createPlayer } from "@game/entities/createPlayer";
import { WaveSystem } from "@game/systems/WaveSystem";
import { Enemy } from "@game/components/Enemy";
import { ELITE } from "@game/entities/createEnemy";

let failures = 0;
function check(label: string, cond: boolean): void {
  if (!cond) {
    failures++;
    console.error(`  ✗ ${label}`);
  } else {
    console.log(`  ✓ ${label}`);
  }
}

check("waves are ordered by time", WAVES.every((w, i) => i === 0 || w.at >= WAVES[i - 1].at));
check("waves reference real enemies", WAVES.every((w) => !!ENEMIES[w.enemyId]));

const bus = createGameEventBus();
const fired: string[] = [];
bus.on("waveSpawned", ({ label }) => fired.push(label));

const world = new World();
createPlayer(world, 0, 0);
const sys = new WaveSystem(bus);
const time = new Time();

// Before the first wave: nothing.
time.elapsed = WAVES[0].at - 1;
sys.update(world, time);
check("no wave before its time", world.count(Enemy) === 0);

// First wave fires exactly once.
time.elapsed = WAVES[0].at;
sys.update(world, time);
check("first wave spawns its formation", world.count(Enemy) === WAVES[0].count);
check("waveSpawned emitted", fired.length === 1);
sys.update(world, time);
check("a wave never fires twice", world.count(Enemy) === WAVES[0].count);

// All members spawn off the player at the same distance band.
let minDist = Infinity;
for (const e of world.queryArray(Enemy, Transform)) {
  const pos = world.get(e, Transform)!.position;
  minDist = Math.min(minDist, Math.hypot(pos.x, pos.y));
}
check("formation spawns away from the player", minDist > 400);

// Jump past every wave: all fire, including the elite one.
time.elapsed = WAVES[WAVES.length - 1].at + 1;
sys.update(world, time);
const total = WAVES.reduce((n, w) => n + w.count, 0);
check("all waves fire when time passes them", world.count(Enemy) === total);
check("every label announced", fired.length === WAVES.length);

const eliteWave = WAVES.find((w) => w.elite)!;
const eliteHealth = ENEMIES[eliteWave.enemyId].health * ELITE.health;
let elites = 0;
for (const e of world.queryArray(Enemy, Health)) {
  if (world.get(e, Health)!.max === eliteHealth) elites++;
}
check("elite wave members carry elite health", elites >= eliteWave.count);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll wave checks passed");
