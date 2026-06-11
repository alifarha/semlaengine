import type { World, Entity } from "@engine";
import { Player } from "../components/Player";
import type { Weapon } from "../components/Weapon";
import { WeaponInventory } from "../components/WeaponInventory";
import { WEAPONS, weaponFromDef } from "./weapons";
import { Health } from "@engine";

/**
 * A rune-kenning: the DRAUGR framing of a level-up upgrade. Each is an Elder
 * Futhark rune whose mythological meaning maps to its mechanical effect. On
 * level-up the player is offered a choice of three (see `KenningScreen`); the
 * chosen rune's `apply` mutates the player's live components.
 *
 * Stacking the same rune repeatedly is allowed — the GDD's "Kenning at ×3"
 * compound effects are a future layer on top of this.
 */
export interface Rune {
  readonly id: string;
  /** Elder Futhark glyph shown on the card. */
  readonly glyph: string;
  /** Transliterated name, e.g. "Uruz". */
  readonly name: string;
  /** Plain mechanical description. */
  readonly description: string;
  /** Short Eddic-style flavour line. */
  readonly flavor: string;
  readonly apply: (world: World, player: Entity) => void;
  /**
   * Whether this rune may be offered right now (e.g. weapon-granting runes
   * disappear once the weapon is owned or the inventory is full). Omitted
   * means always available.
   */
  readonly available?: (world: World, player: Entity) => boolean;
}

/** Apply a mutation to every weapon the player holds. */
function eachWeapon(world: World, player: Entity, fn: (w: Weapon) => void): void {
  const inventory = world.get(player, WeaponInventory);
  if (inventory) for (const weapon of inventory.weapons) fn(weapon);
}

/** A rune that adds the given weapon blueprint to the player's armament. */
function grantWeaponRune(
  weaponId: string,
  rune: Omit<Rune, "apply" | "available">,
): Rune {
  return {
    ...rune,
    apply: (world, player) => {
      const inventory = world.get(player, WeaponInventory);
      if (inventory && !inventory.has(weaponId)) {
        inventory.add(weaponFromDef(WEAPONS[weaponId]));
      }
    },
    available: (world, player) => {
      const inventory = world.get(player, WeaponInventory);
      return !!inventory && !inventory.isFull && !inventory.has(weaponId);
    },
  };
}

export const RUNES: readonly Rune[] = [
  {
    id: "uruz",
    glyph: "ᚢ",
    name: "Uruz",
    description: "+15% weapon damage.",
    flavor: "The auroch's strength floods dead sinew.",
    apply: (world, player) => {
      const p = world.get(player, Player);
      if (p) p.might *= 1.15;
    },
  },
  {
    id: "raidho",
    glyph: "ᚱ",
    name: "Raidho",
    description: "+12% movement speed.",
    flavor: "The ride of the dead quickens.",
    apply: (world, player) => {
      const p = world.get(player, Player);
      if (p) p.moveSpeed *= 1.12;
    },
  },
  {
    id: "fehu",
    glyph: "ᚠ",
    name: "Fehu",
    description: "+30% sál pickup range.",
    flavor: "Wealth calls to wealth; sál to sál.",
    apply: (world, player) => {
      const p = world.get(player, Player);
      if (p) p.magnetRadius *= 1.3;
    },
  },
  {
    id: "sowilo",
    glyph: "ᛋ",
    name: "Sowilo",
    description: "-13% cooldown on all weapons.",
    flavor: "The sun wheels faster across the dead sky.",
    apply: (world, player) =>
      eachWeapon(world, player, (w) => (w.cooldown *= 0.87)),
  },
  {
    id: "tiwaz",
    glyph: "ᛏ",
    name: "Tiwaz",
    description: "+1 projectile per cast, on all weapons.",
    flavor: "Tyr's hand guides each throw.",
    apply: (world, player) => eachWeapon(world, player, (w) => (w.count += 1)),
  },
  {
    id: "thurisaz",
    glyph: "ᚦ",
    name: "Thurisaz",
    description: "+1 pierce — strikes pass through more foes.",
    flavor: "The giant's thorn passes through many.",
    apply: (world, player) => eachWeapon(world, player, (w) => (w.pierce += 1)),
  },
  {
    id: "ansuz",
    glyph: "ᚨ",
    name: "Ansuz",
    description: "+20% projectile speed and +5% damage on all weapons.",
    flavor: "Odin's breath speeds the cast.",
    apply: (world, player) =>
      eachWeapon(world, player, (w) => {
        w.projectileSpeed *= 1.2;
        w.damage *= 1.05;
      }),
  },
  grantWeaponRune("spread", {
    id: "hagalaz",
    glyph: "ᚺ",
    name: "Hagalaz",
    description: "New weapon: Scatter Shot — a fan of bolts like driving hail.",
    flavor: "Hail falls on the living and the dead alike.",
  }),
  grantWeaponRune("lance", {
    id: "gebo",
    glyph: "ᚷ",
    name: "Gebo",
    description: "New weapon: Gungnir's Splinter — a heavy spear that skewers four foes.",
    flavor: "A gift from the spear-god demands a gift in return.",
  }),
  {
    id: "algiz",
    glyph: "ᛉ",
    name: "Algiz",
    description: "+25 max vigour, and mend that much now.",
    flavor: "The elk-ward shields the barrow-flesh.",
    apply: (world, player) => {
      const h = world.get(player, Health);
      if (h) {
        h.max += 25;
        h.current = Math.min(h.max, h.current + 25);
      }
    },
  },
];

/**
 * Pick `count` distinct runes at random for a Kenning offer. When `world` and
 * `player` are given, runes whose `available` check fails are excluded (e.g.
 * already-owned weapon grants).
 */
export function rollKennings(count = 3, world?: World, player?: Entity): Rune[] {
  const pool =
    world !== undefined && player !== undefined
      ? RUNES.filter((r) => r.available?.(world, player) ?? true)
      : [...RUNES];
  // Fisher–Yates partial shuffle.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
