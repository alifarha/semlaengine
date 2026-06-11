/**
 * Tests for the Kenning (rune) system: rolling distinct offers and applying
 * rune effects to the player. DOM-free — bundled with esbuild and run on node.
 */
import { World, Health } from "@engine";
import { RUNES, rollKennings, formForFullness, FormState } from "@game";
import { createPlayer } from "@game/entities/createPlayer";
import { Player } from "@game/components/Player";
import { WeaponInventory } from "@game/components/WeaponInventory";
import { DraugrForm } from "@game/components/DraugrForm";

let failures = 0;
function check(label: string, cond: boolean): void {
  if (!cond) {
    failures++;
    console.error(`  ✗ ${label}`);
  } else {
    console.log(`  ✓ ${label}`);
  }
}

function runeById(id: string) {
  const rune = RUNES.find((r) => r.id === id);
  if (!rune) throw new Error(`missing rune ${id}`);
  return rune;
}

// --- Rolling offers ---
const offer = rollKennings(3);
check("rollKennings returns 3 options", offer.length === 3);
check("offer options are distinct", new Set(offer.map((r) => r.id)).size === 3);
const all = rollKennings(99);
check("rollKennings caps at pool size", all.length === RUNES.length);
check("full roll is all distinct", new Set(all.map((r) => r.id)).size === RUNES.length);

// --- Applying rune effects ---
const world = new World();
const player = createPlayer(world, 0, 0);

const might0 = world.get(player, Player)!.might;
runeById("uruz").apply(world, player);
check("Uruz raises might by 15%", Math.abs(world.get(player, Player)!.might - might0 * 1.15) < 1e-6);

const inventory = () => world.get(player, WeaponInventory)!;

const count0 = inventory().weapons[0].count;
runeById("tiwaz").apply(world, player);
check("Tiwaz adds a projectile", inventory().weapons[0].count === count0 + 1);

const cd0 = inventory().weapons[0].cooldown;
runeById("sowilo").apply(world, player);
check("Sowilo cuts cooldown", inventory().weapons[0].cooldown < cd0);

// --- Weapon-granting runes ---
check("starts with one weapon", inventory().weapons.length === 1);
check(
  "Hagalaz offered while Scatter Shot unowned",
  runeById("hagalaz").available!(world, player) === true,
);
runeById("hagalaz").apply(world, player);
check("Hagalaz grants Scatter Shot", inventory().has("spread"));
check(
  "Hagalaz no longer offered once owned",
  runeById("hagalaz").available!(world, player) === false,
);
const cdAll0 = inventory().weapons.map((w) => w.cooldown);
runeById("sowilo").apply(world, player);
check(
  "stat runes hit every held weapon",
  inventory().weapons.every((w, i) => w.cooldown < cdAll0[i]),
);
const offerFiltered = rollKennings(99, world, player);
check(
  "filtered roll excludes owned weapon grants",
  !offerFiltered.some((r) => r.id === "hagalaz"),
);

const h = world.get(player, Health)!;
h.current = 10;
const max0 = h.max;
runeById("algiz").apply(world, player);
check("Algiz raises max vigour", h.max === max0 + 25);
check("Algiz mends current vigour", h.current === 35);

// --- Draugr form thresholds ---
check("0.05 fullness -> Starving (-30% dmg)", formForFullness(0.05).state === FormState.Starving && formForFullness(0.05).damageMul === 0.7);
check("0.40 fullness -> Risen (normal)", formForFullness(0.4).state === FormState.Risen && formForFullness(0.4).damageMul === 1);
check("0.70 fullness -> Gorged (+15% dmg)", formForFullness(0.7).state === FormState.Gorged && formForFullness(0.7).damageMul === 1.15);
check("0.95 fullness -> Barrow-King (+35% dmg)", formForFullness(0.95).state === FormState.BarrowKing && formForFullness(0.95).damageMul === 1.35);
check("Gorged widens aura", formForFullness(0.7).auraMul > 1);
check("player starts with a DraugrForm", world.get(player, DraugrForm) !== undefined);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll Kenning checks passed");
