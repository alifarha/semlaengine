/**
 * Tests for the Kenning (rune) system: rolling distinct offers and applying
 * rune effects to the player. DOM-free — bundled with esbuild and run on node.
 */
import { World, Health } from "@engine";
import { RUNES, rollKennings } from "@game";
import { createPlayer } from "@game/entities/createPlayer";
import { Player } from "@game/components/Player";
import { Weapon } from "@game/components/Weapon";

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

const count0 = world.get(player, Weapon)!.count;
runeById("tiwaz").apply(world, player);
check("Tiwaz adds a projectile", world.get(player, Weapon)!.count === count0 + 1);

const cd0 = world.get(player, Weapon)!.cooldown;
runeById("sowilo").apply(world, player);
check("Sowilo cuts cooldown", world.get(player, Weapon)!.cooldown < cd0);

const h = world.get(player, Health)!;
h.current = 10;
const max0 = h.max;
runeById("algiz").apply(world, player);
check("Algiz raises max vigour", h.max === max0 + 25);
check("Algiz mends current vigour", h.current === 35);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll Kenning checks passed");
