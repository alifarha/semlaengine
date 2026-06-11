import {
  Scene,
  type EngineContext,
  type Renderer,
  Time,
  Transform,
  Vector2,
  MovementSystem,
  LifetimeSystem,
  AnimationSystem,
} from "@engine";
import { createPlayer } from "../entities/createPlayer";
import { Player } from "../components/Player";
import { PlayerProgress } from "../components/PlayerProgress";
import { PlayerControlSystem } from "../systems/PlayerControlSystem";
import { DraugrFormSystem } from "../systems/DraugrFormSystem";
import { EnemyAISystem } from "../systems/EnemyAISystem";
import { EnemySpawnSystem } from "../systems/EnemySpawnSystem";
import { WaveSystem } from "../systems/WaveSystem";
import { BossSystem } from "../systems/BossSystem";
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
import { addShards, shardsForRun } from "../meta";
import { GameOverScene, type RunSummary } from "./GameOverScene";

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
  /** Results captured the moment the player dies (the entity is reaped right after). */
  private summary: RunSummary | null = null;

  /**
   * Run-local clock handed to the systems instead of the engine's global time.
   * The engine clock keeps counting across menu, game-over, and Kenning pauses,
   * so difficulty ramps, unlock/boss timers, and the survival readout all key
   * off this clock — it starts at zero each run and only advances while the
   * simulation actually steps.
   */
  private readonly runClock = new Time();

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
    // BossSystem runs after the generic enemy AI so it can override Hati's
    // velocity with flanking movement.
    this.addSystem(new BossSystem(this.events));
    this.addSystem(new EnemySpawnSystem(this.ctx.renderer.camera));
    this.addSystem(new WaveSystem(this.events, this.ctx.renderer.camera));
    this.addSystem(new WeaponSystem(this.events));
    this.addSystem(new MovementSystem());
    this.addSystem(new CollisionSystem(this.events));
    this.addSystem(new ExperienceSystem(this.events));
    this.addSystem(new DeathSystem(this.events));
    this.addSystem(new LifetimeSystem());
    this.addSystem(new AnimationSystem());
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
      // Snapshot the results now: DeathSystem destroys the player entity, so
      // by render time its PlayerProgress is no longer queryable.
      const progress = this.world.get(player, PlayerProgress);
      const level = progress?.level ?? 1;
      const kills = progress?.kills ?? 0;
      const shards = shardsForRun(level, kills);
      addShards(shards); // bank meta-progression currency immediately
      this.summary = { level, kills, shards, time: this.runClock.elapsed };
    });
    // Each level-up queues a Kenning choice; the choice is resolved in update().
    this.events.on("playerLeveledUp", () => {
      this.pendingLevels++;
    });
  }

  override update(time: Time): void {
    // Player-facing pause. Unpausing is handled in render(): while the loop is
    // paused no updates run, but rendering (and its input-edge window) does.
    if (!this.playerDead && this.ctx.input.wasPressed("KeyP")) {
      this.ctx.loop.pause();
      return;
    }

    // While a Kenning choice is pending, freeze the simulation and resolve the
    // player's pick. Multiple queued level-ups present one choice at a time.
    if (!this.playerDead && this.pendingLevels > 0) {
      if (!this.currentOffer) {
        const player = this.world.first(Player);
        this.currentOffer =
          player >= 0 ? rollKennings(3, this.world, player) : rollKennings(3);
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
      return; // simulation paused until the choice is made (run clock frozen too)
    }

    // Step the run clock in lockstep with the engine clock (same fixed delta
    // and time scale), but only on steps the simulation actually runs.
    this.runClock.delta = time.delta;
    this.runClock.scale = time.scale;
    super.update(this.runClock);
    this.runClock.advance();
  }

  render(renderer: Renderer, alpha: number): void {
    // Camera follows the player's *interpolated* position — the same one the
    // sprite is drawn at — so the player doesn't jitter against the camera.
    const playerEntity = this.world.first(Player, Transform);
    if (playerEntity >= 0) {
      const t = this.world.get(playerEntity, Transform)!;
      renderer.camera.follow(
        Vector2.lerp(t.previousPosition, t.position, alpha),
        this.ctx.time.frameDelta,
      );
    }

    renderer.begin();
    renderer.drawGrid(64, "#1e1e2e");
    this.renderSystem.render(this.world, renderer, alpha);
    this.effectsRenderer.render(this.world, renderer);
    renderer.end();

    this.hud.render(this.world, renderer, this.runClock.elapsed);

    // The Kenning choice draws on top of the frozen world + HUD.
    if (this.currentOffer) {
      this.kenningScreen.render(this.currentOffer, this.ctx.input, renderer);
    }

    // Paused overlay + unpause. Input edges are still delivered during render
    // while the loop is paused (the engine flushes them after overlays).
    if (this.ctx.loop.isPaused) {
      if (this.ctx.input.wasPressed("KeyP")) {
        this.ctx.loop.resume();
      } else {
        renderer.resetTransform();
        const ctx = renderer.ctx;
        ctx.fillStyle = "rgba(8, 6, 4, 0.55)";
        ctx.fillRect(0, 0, renderer.width, renderer.height);
        ctx.fillStyle = "#f0e8d8";
        ctx.font = "bold 34px Georgia, serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("PAUSED", renderer.width / 2, renderer.height / 2 - 8);
        ctx.fillStyle = "#9b8f76";
        ctx.font = "15px system-ui, sans-serif";
        ctx.fillText("Press P to resume", renderer.width / 2, renderer.height / 2 + 22);
      }
    }

    if (this.playerDead && this.summary) {
      this.ctx.scenes.change(new GameOverScene(this.ctx, this.summary));
    }
  }
}
