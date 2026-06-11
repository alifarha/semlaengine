import type { Component } from "@engine";
import { Weapon } from "./Weapon";

/**
 * The player's armament: several auto-firing {@link Weapon}s, each with its own
 * cooldown, running simultaneously — the genre's build-variety engine. Runes
 * grant new weapons (up to {@link WeaponInventory.MAX_WEAPONS}) and stat runes
 * apply across every weapon held.
 */
export class WeaponInventory implements Component {
  static readonly MAX_WEAPONS = 4;

  readonly weapons: Weapon[];

  constructor(...weapons: Weapon[]) {
    this.weapons = weapons;
  }

  get isFull(): boolean {
    return this.weapons.length >= WeaponInventory.MAX_WEAPONS;
  }

  has(id: string): boolean {
    return this.weapons.some((w) => w.id === id);
  }

  /** Add a weapon unless the inventory is full. Returns whether it was added. */
  add(weapon: Weapon): boolean {
    if (this.isFull) return false;
    this.weapons.push(weapon);
    return true;
  }
}
