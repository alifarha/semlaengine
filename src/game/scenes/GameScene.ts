import {
  Scene,
  type EngineContext,
  type Renderer,
  type Time,
  Transform,
  MovementSystem,
  LifetimeSystem,
} from "@engine";
import { createPlayer } from "../entities/createPlayer";
import { Player } from "../components/Player";
import { PlayerProgress } from "../components/PlayerProgress";
import { PlayerControlSystem } from "../systems/PlayerControlSystem";
import { DraugrFormSystem } from "../systems/DraugrFormSystem";
import { EnemyAISystem } from "../systems/EnemyAISystem";
import { EnemySpawnSystem } from "../systems/EnemySpawnSystem";
import { CollisionSystem } from "../systems/CollisionSystem";
import { WeaponSystem } from "../systems/WeaponSystem";
import { ExperienceSystem } from "../systems/ExperienceSystem";
import { DeathSystem } from "../systems/DeathSystem";
import { EffectsSystem } from "../systems/EffectsSystem";
import { RenderSystem } from "../systems/RenderSystem";
import { EffectsRenderer } from "../systems/EffectsRenderer";
import { Hud } from "../ui/Hud";
import { KenningScreen } from "../ui/KenningScreen";
import { rollKennings, type Rune } from "../data/runes";
import { createGameEventBus, type GameEventBus } from "../events";
import { GameOverScene } from "./GameOverScene";

/**
 * The main play field. Owns the simulation pipeline and the run state.
 *
 * System order *is* the gameplay pipeline, so it is deliberate:
 *   input → AI → spawn → weapons → movement → collision/damage → progression →
 *   death-reaping → lifetime cleanup.
 */
export class GameScene extends Scene {
  private readonly events: GameEventBus = createGameEventBus();
  private readonly renderSystem = new RenderSystem();
  private readonly effectsRenderer = new EffectsRenderer();
  private readonly hud = new Hud();
  private readonly kenningScreen = new KenningScreen();
  private playerDead = false;

  /** Pending level-ups awaiting a Kenning choice; >0 freezes the simulation. */
  private pendingLevels = 0;
  /** The three runes currently offered, or null when not choosing. */
  private currentOffer: Rune[] | null = null;

  constructor(ctx: EngineContext) {
    super(ctx);
  }

  onEnter(): void {
    this.playerDead = false;

    const player = createPlayer(this.world, 0, 0);
    this.ctx.renderer.camera.snapTo(this.world.get(player, Transform)!.position);

    // Simulation pipeline (order matters — see class doc).
    this.addSystem(new PlayerControlSystem(this.ctx.input));
    this.addSystem(new DraugrFormSystem(this.events));
    this.addSystem(new EnemyAISystem());
    this.addSystem(new EnemySpawnSystem());
    this.addSystem(new WeaponSystem(this.events));
    this.addSystem(new MovementSystem());
    this.addSystem(new CollisionSystem(this.events));
    this.addSystem(new ExperienceSystem(this.events));
    this.addSystem(new DeathSystem(this.events));
    this.addSystem(new LifetimeSystem());
    // Effects last: it reacts to events emitted earlier this step and advances
    // the transient particle/text/flash entities those events spawn.
    this.addSystem(new EffectsSystem(this.events, this.ctx));

    // Run-state bookkeeping via events.
    this.events.on("enemyKilled", () => {
      const p = this.world.first(Player, PlayerProgress);
      if (p >= 0) this.world.get(p, PlayerProgress)!.kills++;
    });
    this.events.on("playerDied", () => {
      this.playerDead = true;
    });
    // Each level-up queues a Kenning choice; the choice is resolved in update().
    this.events.on("playerLeveledUp", () => {
      this.pendingLevels++;
    });
  }

  override update(time: Time): void {
    // While a Kenning choice is pending, freeze the simulation and resolve the
    // player's pick. Multiple queued level-ups present one choice at a time.
    if (!this.playerDead && this.pendingLevels > 0) {
      if (!this.currentOffer) {
        this.currentOffer = rollKennings(3);
        this.kenningScreen.begin();
      }
      const picked = this.kenningScreen.poll(
        this.currentOffer,
        this.ctx.input,
        this.ctx.renderer,
      );
      if (picked !== null) {
        const player = this.world.first(Player);
        if (player >= 0) this.currentOffer[picked].apply(this.world, player);
        this.pendingLevels--;
        this.currentOffer = null;
      }
      return; // simulation paused until the choice is made
    }

    super.update(time);
  }

  render(renderer: Renderer, alpha: number): void {
    // Camera follows the player smoothly.
    const playerEntity = this.world.first(Player, Transform);
    if (playerEntity >= 0) {
      renderer.camera.follow(this.world.get(playerEntity, Transform)!.position);
    }

    renderer.begin();
    renderer.drawGrid(64, "#1e1e2e");
    this.renderSystem.render(this.world, renderer, alpha);
    this.effectsRenderer.render(this.world, renderer);
    renderer.end();

    this.hud.render(this.world, renderer, this.ctx.time.elapsed);

    // The Kenning choice draws on top of the frozen world + HUD.
    if (this.currentOffer) {
      this.kenningScreen.render(this.currentOffer, this.ctx.input, renderer);
    }

    if (this.playerDead) {
      const progress = playerEntity >= 0
        ? this.world.get(playerEntity, PlayerProgress)
        : undefined;
      this.ctx.scenes.change(
        new GameOverScene(this.ctx, {
          level: progress?.level ?? 1,
          kills: progress?.kills ?? 0,
          time: this.ctx.time.elapsed,
        }),
      );
    }
  }
}
