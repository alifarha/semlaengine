import { System, type World, type Time, Velocity } from "@engine";
import type { InputManager } from "@engine";
import { Player } from "../components/Player";

/** Translates input into the player's velocity each step. */
export class PlayerControlSystem extends System {
  constructor(private readonly input: InputManager) {
    super();
  }

  update(world: World, _time: Time): void {
    const axis = this.input.getMovementAxis();
    for (const entity of world.query(Player, Velocity)) {
      const player = world.get(entity, Player)!;
      const velocity = world.get(entity, Velocity)!;
      velocity.value.set(axis.x, axis.y).scale(player.moveSpeed);
    }
  }
}
