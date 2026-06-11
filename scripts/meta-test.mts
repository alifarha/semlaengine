/**
 * Meta-progression tests: shard banking, upgrade purchase rules, stat bonuses,
 * and corrupted-save tolerance. Uses an in-memory storage fake — no browser.
 */
import { World, Health } from "@engine";
import {
  META_UPGRADES,
  setMetaStorage,
  loadMeta,
  addShards,
  buyUpgrade,
  upgradeCost,
  shardsForRun,
  metaBonuses,
} from "@game";
import { createPlayer } from "@game/entities/createPlayer";
import { Player } from "@game/components/Player";

let failures = 0;
function check(label: string, cond: boolean): void {
  if (!cond) {
    failures++;
    console.error(`  ✗ ${label}`);
  } else {
    console.log(`  ✓ ${label}`);
  }
}

const fakeStore = new Map<string, string>();
setMetaStorage({
  getItem: (k) => fakeStore.get(k) ?? null,
  setItem: (k, v) => void fakeStore.set(k, v),
});

// --- Fresh state ---
let state = loadMeta();
check("fresh meta starts empty", state.shards === 0 && Object.keys(state.upgrades).length === 0);
check("shardsForRun pays at least 1", shardsForRun(1, 0) >= 1);
check("shardsForRun scales with results", shardsForRun(10, 200) > shardsForRun(2, 10));

// --- Banking + buying ---
state = addShards(100);
check("shards bank and persist", loadMeta().shards === 100);

const vigour = META_UPGRADES.find((u) => u.id === "vigour")!;
const cost0 = upgradeCost(vigour, 0);
const afterBuy = buyUpgrade("vigour");
check("buyUpgrade spends shards", afterBuy !== null && afterBuy.shards === 100 - cost0);
check("buyUpgrade raises level", loadMeta().upgrades.vigour === 1);
check("next level costs more", upgradeCost(vigour, 1) > cost0);
check("unknown upgrade rejected", buyUpgrade("nonsense") === null);

// Drain shards, then a purchase must fail.
const drained = loadMeta();
drained.shards = 0;
setMetaStorage({
  getItem: () => JSON.stringify(drained),
  setItem: () => {},
});
check("unaffordable purchase rejected", buyUpgrade("might") === null);

// Restore the writable fake and max out vigour.
setMetaStorage({
  getItem: (k) => fakeStore.get(k) ?? null,
  setItem: (k, v) => void fakeStore.set(k, v),
});
addShards(10_000);
let bought = 0;
while (buyUpgrade("vigour")) bought++;
check("vigour stops at maxLevel", loadMeta().upgrades.vigour === vigour.maxLevel);
check("maxed upgrade rejected", buyUpgrade("vigour") === null);

// --- Bonuses applied to a fresh player ---
const bonuses = metaBonuses();
check("maxed vigour grants +100", bonuses.vigour === 100);

const world = new World();
const player = createPlayer(world, 0, 0);
check(
  "createPlayer bakes vigour into max health",
  world.get(player, Health)!.max === 100 + bonuses.vigour,
);
check(
  "createPlayer bakes might multiplier",
  Math.abs(world.get(player, Player)!.might - bonuses.mightMul) < 1e-9,
);

// --- Corrupted save tolerated ---
setMetaStorage({ getItem: () => "{not json", setItem: () => {} });
check("corrupted save loads as fresh", loadMeta().shards === 0);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll meta-progression checks passed");
