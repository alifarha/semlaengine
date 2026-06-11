/**
 * Round-trip test for world serialization (no DOM needed). Bundled with esbuild
 * and run under node — see the npm/bash invocation in the session.
 */
import {
  World,
  ComponentRegistry,
  WorldSerializer,
  registerBuiltinComponents,
  Transform,
  Health,
  Velocity,
} from "@engine";
import { registerGameComponents } from "@game";
import { createPlayer } from "@game/entities/createPlayer";
import { createEnemy } from "@game/entities/createEnemy";
import { Player } from "@game/components/Player";
import { WeaponInventory } from "@game/components/WeaponInventory";
import { PlayerProgress } from "@game/components/PlayerProgress";
import { DraugrForm } from "@game/components/DraugrForm";
import { ENEMIES } from "@game/data/enemies";

let failures = 0;
function check(label: string, cond: boolean): void {
  if (!cond) {
    failures++;
    console.error(`  ✗ ${label}`);
  } else {
    console.log(`  ✓ ${label}`);
  }
}

// --- Build a representative world ---
const world = new World();
const player = createPlayer(world, 12, -34);
// Mutate some state so we can verify it survives the round-trip.
world.get(player, Player)!.might = 2.5;
world.get(player, Health)!.current = 73;
world.get(player, WeaponInventory)!.weapons[0].cooldown = 0.42;
const prog = world.get(player, PlayerProgress)!;
prog.level = 7;
prog.kills = 99;
world.get(player, Velocity)!.value.set(5, -8);
world.get(player, DraugrForm)!.fullness = 0.83;

createEnemy(world, ENEMIES.bat, 100, 200);
createEnemy(world, ENEMIES.zombie, -50, 60);

const before = world.entityCount;

// --- Round-trip ---
const registry = new ComponentRegistry();
registerBuiltinComponents(registry);
registerGameComponents(registry);
const serializer = new WorldSerializer(registry);

const json = serializer.toJSON(world);
const restored = new World();
serializer.fromJSON(restored, json);

// --- Assertions ---
check("entity count preserved", restored.entityCount === before);

const rPlayer = restored.first(Player, Transform);
check("player exists after load", rPlayer >= 0);
const t = restored.get(rPlayer, Transform)!;
check("transform position preserved", t.position.x === 12 && t.position.y === -34);
check(
  "transform position is a real Vector2 (methods intact)",
  typeof t.position.distanceToSq === "function",
);
check("player.might preserved", restored.get(rPlayer, Player)!.might === 2.5);
check("health.current preserved", restored.get(rPlayer, Health)!.current === 73);
const rInv = restored.get(rPlayer, WeaponInventory)!;
check("weapon inventory preserved", rInv.weapons.length === 1);
check("weapon.cooldown preserved", rInv.weapons[0].cooldown === 0.42);
check("weapon id preserved", rInv.weapons[0].id === "bolt");
const rProg = restored.get(rPlayer, PlayerProgress)!;
check("progress preserved", rProg.level === 7 && rProg.kills === 99);
const rVel = restored.get(rPlayer, Velocity)!;
check("velocity preserved", rVel.value.x === 5 && rVel.value.y === -8);
check("draugr fullness preserved", Math.abs(restored.get(rPlayer, DraugrForm)!.fullness - 0.83) < 1e-6);

// Re-serializing the restored world should produce identical JSON (stable).
check("re-serialization is stable", serializer.toJSON(restored) === json);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll serialization round-trip checks passed");
