import { Weapon } from "../components/Weapon";

/**
 * Tunable weapon stats, stored as plain data so they can be edited live (e.g. in
 * the editor's Data/Balance panel) and serialized. {@link weaponFromDef} builds
 * a fresh {@link Weapon} component from these — each armed entity gets its own
 * copy, so the same blueprint can equip many entities without shared state.
 */
export interface WeaponStats {
  cooldown: number;
  damage: number;
  projectileSpeed: number;
  projectileLifetime: number;
  pierce: number;
  count: number;
}

export interface WeaponDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Mutable so tools can tune balance; changes apply to weapons built later. */
  readonly stats: WeaponStats;
}

export const WEAPONS: Record<string, WeaponDef> = {
  bolt: {
    id: "bolt",
    name: "Magic Bolt",
    description: "Fires a bolt at the nearest enemy.",
    stats: {
      cooldown: 0.7,
      damage: 10,
      projectileSpeed: 280,
      projectileLifetime: 1.4,
      pierce: 1,
      count: 1,
    },
  },
  spread: {
    id: "spread",
    name: "Scatter Shot",
    description: "Launches several bolts in a fan.",
    stats: {
      cooldown: 1.1,
      damage: 7,
      projectileSpeed: 240,
      projectileLifetime: 1.0,
      pierce: 1,
      count: 3,
    },
  },
  lance: {
    id: "lance",
    name: "Gungnir's Splinter",
    description: "A slow, heavy spear-cast that skewers through the swarm.",
    stats: {
      cooldown: 1.8,
      damage: 26,
      projectileSpeed: 360,
      projectileLifetime: 1.6,
      pierce: 4,
      count: 1,
    },
  },
};

/** Build a fresh Weapon component from a definition's stats. */
export function weaponFromDef(def: WeaponDef): Weapon {
  return new Weapon({ ...def.stats, id: def.id });
}

export const STARTING_WEAPON = WEAPONS.bolt;
