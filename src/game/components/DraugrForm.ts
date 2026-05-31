import type { Component } from "@engine";

/**
 * The draugr's physical condition, driven by how recently it has fed on sál.
 *
 * `fullness` (0..1) rises when sál orbs are drunk and decays over time — stop
 * killing and the draugr weakens. The derived {@link FormState} grants or denies
 * combat bonuses and changes the body's appearance, per the design document.
 *
 * Note: this is a separate gauge from level progress (`PlayerProgress`). Tying
 * form to the level bar would dump the draugr into "Starving" right after every
 * level-up; a dedicated fullness meter keeps the "feed or fade" tension where
 * the GDD wants it — on sustained killing, not on leveling.
 */
export class DraugrForm implements Component {
  fullness = 0.4; // start Risen
  state: FormState = FormState.Risen;
  /** Multiplier applied to weapon damage. */
  damageMul = 1;
  /** Multiplier applied to sál pickup (aura) radius. */
  auraMul = 1;
}

export const FormState = {
  Starving: "Starving",
  Risen: "Risen",
  Gorged: "Gorged",
  BarrowKing: "Barrow-King",
} as const;

export type FormState = (typeof FormState)[keyof typeof FormState];

export interface FormProfile {
  state: FormState;
  damageMul: number;
  auraMul: number;
}

/**
 * Map a fullness value to a form profile. Pure and exported so the form system
 * and tests share one source of truth for the thresholds.
 */
export function formForFullness(fullness: number): FormProfile {
  if (fullness < 0.1) return { state: FormState.Starving, damageMul: 0.7, auraMul: 0.9 };
  if (fullness < 0.55) return { state: FormState.Risen, damageMul: 1, auraMul: 1 };
  if (fullness < 0.9) return { state: FormState.Gorged, damageMul: 1.15, auraMul: 1.2 };
  return { state: FormState.BarrowKing, damageMul: 1.35, auraMul: 1.4 };
}
