import {
  Scene,
  type EngineContext,
  type Renderer,
  Transform,
  MovementSystem,
  LifetimeSystem,
} from "@engine";
import { createPlayer } from "../entities/createPlayer";
import { Player } from "../components/Player";
import { PlayerProgress } from "../components/PlayerProgress";
import { PlayerControlSystem } from "../systems/PlayerControlSystem";
import { EnemyAISystem } from "../systems/EnemyAISystem";
import { EnemySpawnSystem } from "../systems/EnemySpawnSystem";
import { CollisionSystem } from "../systems/CollisionSystem";
import { WeaponSystem } from "../systems/WeaponSystem";
import { ExperienceSystem } from "../systems/ExperienceSystem";
import { DeathSystem } from "../systems/DeathSystem";
import { RenderSystem } from "../systems/RenderSystem";
import { Hud } from "../ui/Hud";
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
  private readonly hud = new Hud();
  private playerDead = false;

  constructor(ctx: EngineContext) {
    super(ctx);
  }

  onEnter(): void {
    this.playerDead = false;

    const player = createPlayer(this.world, 0, 0);
    this.ctx.renderer.camera.snapTo(this.world.get(player, Transform)!.position);

    // Simulation pipeline (order matters — see class doc).
    this.addSystem(new PlayerControlSystem(this.ctx.input));
    this.addSystem(new EnemyAISystem());
    this.addSystem(new EnemySpawnSystem());
    this.addSystem(new WeaponSystem());
    this.addSystem(new MovementSystem());
    this.addSystem(new CollisionSystem());
    this.addSystem(new ExperienceSystem(this.events));
    this.addSystem(new DeathSystem(this.events));
    this.addSystem(new LifetimeSystem());

    // Run-state bookkeeping via events.
    this.events.on("enemyKilled", () => {
      const p = this.world.first(Player, PlayerProgress);
      if (p >= 0) this.world.get(p, PlayerProgress)!.kills++;
    });
    this.events.on("playerDied", () => {
      this.playerDead = true;
    });
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
    renderer.end();

    this.hud.render(this.world, renderer, this.ctx.time.elapsed);

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
