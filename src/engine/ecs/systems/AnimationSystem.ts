import { System } from "../System";
import type { World } from "../World";
import type { Time } from "../../core/Time";
import { Animator } from "../components/Animator";
import { Sprite } from "../components/Sprite";

/**
 * Advances every {@link Animator} and writes the current frame's source rect
 * into the entity's {@link Sprite}. Runs as an ordinary fixed-step system, so
 * animation speed respects the global time scale (slow-mo slows flipbooks).
 */
export class AnimationSystem extends System {
  update(world: World, time: Time): void {
    for (const entity of world.query(Animator, Sprite)) {
      const anim = world.get(entity, Animator)!;
      if (!anim.playing) continue;

      anim.time += time.scaledDelta;
      const raw = Math.floor(anim.time * anim.fps);
      if (anim.loop) {
        anim.frame = raw % anim.frameCount;
      } else {
        anim.frame = Math.min(raw, anim.frameCount - 1);
        if (raw >= anim.frameCount) anim.playing = false;
      }

      const sprite = world.get(entity, Sprite)!;
      sprite.sx = anim.frame * anim.frameWidth;
      sprite.sy = anim.row * anim.frameHeight;
      sprite.sw = anim.frameWidth;
      sprite.sh = anim.frameHeight;
    }
  }
}
