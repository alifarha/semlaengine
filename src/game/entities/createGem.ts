import {
  type World,
  type Entity,
  Transform,
  Velocity,
  Sprite,
  Animator,
  CircleCollider,
  CollisionLayers,
} from "@engine";
import { ExperienceGem } from "../components/ExperienceGem";
import { gemSheet, GEM_SHEET } from "../art/gemSheet";

/** Spawn an experience gem (dropped by a dead enemy). */
export function createGem(
  world: World,
  x: number,
  y: number,
  value: number,
): Entity {
  const gem = world.createEntity();
  world.add(gem, new Transform(x, y));
  world.add(gem, new Velocity());
  world.add(gem, new ExperienceGem(value));

  // Animated image sprite (procedural sheet); shape fallback when headless.
  const sheet = gemSheet();
  world.add(
    gem,
    new Sprite({
      image: sheet,
      // Frame-0 source rect so the gem draws correctly before the first
      // AnimationSystem tick; the animator takes over from there.
      sw: GEM_SHEET.frameSize,
      sh: GEM_SHEET.frameSize,
      shape: "rect",
      width: 12,
      height: 12,
      color: "#46e0a0",
      layer: 3,
    }),
  );
  if (sheet) {
    world.add(
      gem,
      new Animator({
        frameWidth: GEM_SHEET.frameSize,
        frameHeight: GEM_SHEET.frameSize,
        frameCount: GEM_SHEET.frameCount,
        fps: 8,
      }),
    );
  }
  world.add(
    gem,
    new CircleCollider(5, CollisionLayers.Pickup, CollisionLayers.Player),
  );
  return gem;
}
