import type { ComponentRegistry } from "./ComponentRegistry";
import { Transform } from "../ecs/components/Transform";
import { Velocity } from "../ecs/components/Velocity";
import { Sprite } from "../ecs/components/Sprite";
import { CircleCollider } from "../ecs/components/CircleCollider";
import { Health } from "../ecs/components/Health";
import { Lifetime } from "../ecs/components/Lifetime";
import { Animator } from "../ecs/components/Animator";

/** Convenience: read a property off serialized data as a number. */
function num(data: unknown, key: string, fallback = 0): number {
  const value = (data as Record<string, unknown>)[key];
  return typeof value === "number" ? value : fallback;
}

/**
 * Register codecs for the engine's built-in components. Games call this once on
 * their {@link ComponentRegistry}, then add their own component codecs.
 *
 * Note: the Sprite codec deliberately omits the loaded `image` (a DOM node that
 * can't be serialized) — sprites reload as their shape fallback. Persist an
 * asset key instead if you need image sprites to survive a round-trip.
 */
export function registerBuiltinComponents(registry: ComponentRegistry): void {
  registry.register({
    name: "Transform",
    type: Transform,
    serialize: (t) => ({
      x: t.position.x,
      y: t.position.y,
      rotation: t.rotation,
      scale: t.scale,
    }),
    deserialize: (d) =>
      new Transform(num(d, "x"), num(d, "y"), num(d, "rotation"), num(d, "scale", 1)),
  });

  registry.register({
    name: "Velocity",
    type: Velocity,
    serialize: (v) => ({ x: v.value.x, y: v.value.y }),
    deserialize: (d) => new Velocity(num(d, "x"), num(d, "y")),
  });

  registry.register({
    name: "Sprite",
    type: Sprite,
    serialize: (s) => ({
      shape: s.shape,
      width: s.width,
      height: s.height,
      color: s.color,
      layer: s.layer,
      alpha: s.alpha,
      sx: s.sx,
      sy: s.sy,
      sw: s.sw,
      sh: s.sh,
    }),
    deserialize: (d) => new Sprite(d as Partial<Sprite>),
  });

  registry.register({
    name: "CircleCollider",
    type: CircleCollider,
    serialize: (c) => ({ radius: c.radius, layer: c.layer, mask: c.mask }),
    deserialize: (d) =>
      new CircleCollider(num(d, "radius", 8), num(d, "layer"), num(d, "mask")),
  });

  registry.register({
    name: "Health",
    type: Health,
    serialize: (h) => ({
      current: h.current,
      max: h.max,
      invulnerable: h.invulnerable,
      invulnerabilityDuration: h.invulnerabilityDuration,
    }),
    deserialize: (d) => {
      const health = new Health(num(d, "max", 1), num(d, "invulnerabilityDuration"));
      health.current = num(d, "current", health.max);
      health.invulnerable = num(d, "invulnerable");
      return health;
    },
  });

  registry.register({
    name: "Lifetime",
    type: Lifetime,
    serialize: (l) => ({ remaining: l.remaining }),
    deserialize: (d) => new Lifetime(num(d, "remaining")),
  });

  registry.register({
    name: "Animator",
    type: Animator,
    serialize: (a) => ({
      frameWidth: a.frameWidth,
      frameHeight: a.frameHeight,
      frameCount: a.frameCount,
      fps: a.fps,
      row: a.row,
      loop: a.loop,
      time: a.time,
    }),
    deserialize: (d) => {
      const anim = new Animator({
        frameWidth: num(d, "frameWidth", 16),
        frameHeight: num(d, "frameHeight", 16),
        frameCount: num(d, "frameCount", 1),
        fps: num(d, "fps", 10),
        row: num(d, "row"),
        loop: (d as Record<string, unknown>).loop !== false,
      });
      anim.time = num(d, "time");
      return anim;
    },
  });
}
