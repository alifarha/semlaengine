import { Time } from "./Time";

export interface GameLoopCallbacks {
  /** Fixed-step simulation update. Called zero or more times per frame. */
  update(time: Time): void;
  /** Render the current state. `alpha` is the interpolation factor [0,1]. */
  render(alpha: number): void;
}

/**
 * A fixed-timestep game loop with a render interpolation factor.
 *
 * The loop accumulates real elapsed time and runs the simulation in fixed
 * `Time.delta` steps. This decouples simulation rate from display refresh rate
 * so physics and gameplay stay deterministic on a 60Hz or a 144Hz monitor. A
 * spiral-of-death guard caps how many catch-up steps run in one frame.
 */
export class GameLoop {
  private readonly time = new Time();
  private accumulator = 0;
  private lastTimestamp = 0;
  private running = false;
  private rafId = 0;

  /** Max simulation steps per frame before we drop time (anti spiral-of-death). */
  private readonly maxStepsPerFrame = 5;

  constructor(private readonly callbacks: GameLoopCallbacks) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  getTime(): Time {
    return this.time;
  }

  private tick = (timestamp: number): void => {
    if (!this.running) return;

    // Clamp the frame time so that a long pause (tab in background) doesn't
    // trigger hundreds of catch-up updates the moment we resume.
    let frameTime = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    if (frameTime > 0.25) frameTime = 0.25;

    this.accumulator += frameTime;

    let steps = 0;
    while (this.accumulator >= this.time.delta && steps < this.maxStepsPerFrame) {
      this.callbacks.update(this.time);
      this.time.advance();
      this.accumulator -= this.time.delta;
      steps++;
    }

    // Discard leftover time if we hit the step cap, otherwise the deficit grows.
    if (steps >= this.maxStepsPerFrame) {
      this.accumulator = 0;
    }

    const alpha = this.accumulator / this.time.delta;
    this.callbacks.render(alpha);

    this.rafId = requestAnimationFrame(this.tick);
  };
}
