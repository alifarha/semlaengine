import type { World, Entity } from "@engine";
import { Player } from "../components/Player";
import { Weapon } from "../components/Weapon";

/**
 * Level-up upgrade choices. On level-up the game offers a random subset of
 * these; `apply` mutates the player's components. This is the central knob for
 * build variety — the more upgrades, the more diverse the runs.
 *
 * Hooking up the level-up UI that presents these is left as a TODO (see
 * `ExperienceSystem`); for now the scaffold can auto-apply a random pick.
 */
export interface UpgradeDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly apply: (world: World, player: Entity) => void;
}

export const UPGRADES: readonly UpgradeDef[] = [
  {
    id: "might",
    name: "Might",
    description: "+15% weapon damage.",
    apply: (world, player) => {
      const p = world.get(player, Player);
      if (p) p.might *= 1.15;
    },
  },
  {
    id: "swift",
    name: "Swiftness",
    description: "+10% movement speed.",
    apply: (world, player) => {
      const p = world.get(player, Player);
      if (p) p.moveSpeed *= 1.1;
    },
  },
  {
    id: "magnet",
    name: "Magnet",
    description: "+30% pickup range.",
    apply: (world, player) => {
      const p = world.get(player, Player);
      if (p) p.magnetRadius *= 1.3;
    },
  },
  {
    id: "rapid",
    name: "Rapid Fire",
    description: "-12% weapon cooldown.",
    apply: (world, player) => {
      const w = world.get(player, Weapon);
      if (w) w.cooldown *= 0.88;
    },
  },
  {
    id: "multishot",
    name: "Multishot",
    description: "+1 projectile per shot.",
    apply: (world, player) => {
      const w = world.get(player, Weapon);
      if (w) w.count += 1;
    },
  },
];
