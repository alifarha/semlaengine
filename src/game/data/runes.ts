import type { World, Entity } from "@engine";
import { Player } from "../components/Player";
import { Weapon } from "../components/Weapon";
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
    description: "-13% weapon cooldown.",
    flavor: "The sun wheels faster across the dead sky.",
    apply: (world, player) => {
      const w = world.get(player, Weapon);
      if (w) w.cooldown *= 0.87;
    },
  },
  {
    id: "tiwaz",
    glyph: "ᛏ",
    name: "Tiwaz",
    description: "+1 projectile per cast.",
    flavor: "Tyr's hand guides each throw.",
    apply: (world, player) => {
      const w = world.get(player, Weapon);
      if (w) w.count += 1;
    },
  },
  {
    id: "thurisaz",
    glyph: "ᚦ",
    name: "Thurisaz",
    description: "+1 pierce — strikes pass through more foes.",
    flavor: "The giant's thorn passes through many.",
    apply: (world, player) => {
      const w = world.get(player, Weapon);
      if (w) w.pierce += 1;
    },
  },
  {
    id: "ansuz",
    glyph: "ᚨ",
    name: "Ansuz",
    description: "+20% projectile speed and +5% damage.",
    flavor: "Odin's breath speeds the cast.",
    apply: (world, player) => {
      const w = world.get(player, Weapon);
      if (w) {
        w.projectileSpeed *= 1.2;
        w.damage *= 1.05;
      }
    },
  },
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

/** Pick `count` distinct runes at random for a Kenning offer. */
export function rollKennings(count = 3): Rune[] {
  const pool = [...RUNES];
  // Fisher–Yates partial shuffle.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
