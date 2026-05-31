import { Weapon } from "../components/Weapon";

/**
 * Weapon definitions. Each returns a fresh {@link Weapon} component so the same
 * blueprint can arm multiple entities without shared mutable state.
 */
export interface WeaponDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly create: () => Weapon;
}

export const WEAPONS: Record<string, WeaponDef> = {
  bolt: {
    id: "bolt",
    name: "Magic Bolt",
    description: "Fires a bolt at the nearest enemy.",
    create: () =>
      new Weapon({
        cooldown: 0.7,
        damage: 10,
        projectileSpeed: 280,
        projectileLifetime: 1.4,
        pierce: 1,
        count: 1,
      }),
  },
  spread: {
    id: "spread",
    name: "Scatter Shot",
    description: "Launches several bolts in a fan.",
    create: () =>
      new Weapon({
        cooldown: 1.1,
        damage: 7,
        projectileSpeed: 240,
        projectileLifetime: 1.0,
        pierce: 1,
        count: 3,
      }),
  },
};

export const STARTING_WEAPON = WEAPONS.bolt;
