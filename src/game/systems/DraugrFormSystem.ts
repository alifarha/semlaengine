import { System, type World, type Time, MathUtils, Sprite } from "@engine";
import { Player } from "../components/Player";
import {
  DraugrForm,
  FormState,
  formForFullness,
  type FormProfile,
} from "../components/DraugrForm";
import type { GameEventBus } from "../events";

/** Fullness gained per point of sál drunk. */
const FEED_PER_SAL = 0.05;
/** Fullness lost per second when not feeding. */
const DECAY_PER_SEC = 0.06;

/** Rank used to tell whether a form transition is ascending (for juice). */
const FORM_RANK: Record<string, number> = {
  [FormState.Starving]: 0,
  [FormState.Risen]: 1,
  [FormState.Gorged]: 2,
  [FormState.BarrowKing]: 3,
};

/** Body appearance per form: sprite size, colour, opacity. */
const FORM_LOOK: Record<string, { size: number; color: string; alpha: number }> = {
  [FormState.Starving]: { size: 15, color: "#b9a98f", alpha: 0.85 },
  [FormState.Risen]: { size: 18, color: "#ffd166", alpha: 1 },
  [FormState.Gorged]: { size: 21, color: "#ffd9a0", alpha: 1 },
  [FormState.BarrowKing]: { size: 26, color: "#8fb6ff", alpha: 1 },
};

/**
 * Advances the draugr's {@link DraugrForm}: drinking sál (orbs) raises fullness,
 * time drains it. The resulting form grants/denies combat bonuses (read by the
 * weapon and experience systems) and re-skins the player's body. Crossing into
 * a higher form emits `draugrFormChanged` so the effects system can punch it up.
 */
export class DraugrFormSystem extends System {
  private pendingFeed = 0;

  constructor(private readonly events: GameEventBus) {
    super();
  }

  init(): void {
    // Each drunk sál orb feeds the draugr; applied in update to batch lookups.
    this.events.on("gemCollected", ({ value }) => {
      this.pendingFeed += value;
    });
  }

  update(world: World, time: Time): void {
    const player = world.first(Player, DraugrForm, Sprite);
    if (player < 0) return;
    const form = world.get(player, DraugrForm)!;

    // Feed, then decay, clamped to [0,1].
    form.fullness += this.pendingFeed * FEED_PER_SAL;
    this.pendingFeed = 0;
    form.fullness = MathUtils.clamp(
      form.fullness - DECAY_PER_SEC * time.scaledDelta,
      0,
      1,
    );

    const profile = formForFullness(form.fullness);
    if (profile.state !== form.state) {
      this.applyForm(world, player, form, profile);
    }
  }

  private applyForm(
    world: World,
    player: number,
    form: DraugrForm,
    profile: FormProfile,
  ): void {
    const ascending = FORM_RANK[profile.state] > FORM_RANK[form.state];

    form.state = profile.state;
    form.damageMul = profile.damageMul;
    form.auraMul = profile.auraMul;

    const look = FORM_LOOK[profile.state];
    const sprite = world.get(player, Sprite)!;
    sprite.width = look.size;
    sprite.height = look.size;
    sprite.color = look.color;
    sprite.alpha = look.alpha;

    this.events.emit("draugrFormChanged", { state: profile.state, ascending });
  }
}
