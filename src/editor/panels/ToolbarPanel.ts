import type { EditorContext } from "../EditorContext";

/**
 * The top toolbar: play/pause, single-step, a time-scale slider, and live
 * stats (FPS, entity count). Drives the engine's loop-control API added for the
 * editor.
 */
export class ToolbarPanel {
  readonly element: HTMLElement;

  private readonly playBtn: HTMLButtonElement;
  private readonly stepBtn: HTMLButtonElement;
  private readonly scaleLabel: HTMLElement;
  private readonly stats: HTMLElement;

  private lastSampleTime = performance.now();
  private frames = 0;
  private fps = 0;

  constructor(
    private readonly ctx: EditorContext,
    onClose: () => void,
  ) {
    const { engine } = ctx;
    this.element = document.createElement("div");
    this.element.className = "semla-toolbar";

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = "SEMLA EDITOR";

    this.playBtn = button("Pause", () => {
      engine.togglePause();
      this.syncPlay();
    });
    this.stepBtn = button("Step ⏭", () => {
      if (!engine.isPaused) engine.pause();
      engine.step();
      this.syncPlay();
    });

    const scale = document.createElement("input");
    scale.type = "range";
    scale.min = "0";
    scale.max = "3";
    scale.step = "0.1";
    scale.value = String(engine.context.time.scale);
    scale.addEventListener("input", () => {
      engine.context.time.scale = parseFloat(scale.value);
      this.syncScale();
    });
    this.scaleLabel = document.createElement("span");
    this.scaleLabel.className = "stat";

    this.stats = document.createElement("span");
    this.stats.className = "stat";

    const spacer = document.createElement("span");
    spacer.className = "spacer";

    const closeBtn = button("Close ` ", onClose);

    this.element.append(
      title,
      this.playBtn,
      this.stepBtn,
      document.createTextNode("speed"),
      scale,
      this.scaleLabel,
      spacer,
      this.stats,
      closeBtn,
    );

    this.syncPlay();
    this.syncScale();
  }

  private syncPlay(): void {
    this.playBtn.textContent = this.ctx.engine.isPaused ? "Play ▶" : "Pause ⏸";
    this.playBtn.classList.toggle("active", this.ctx.engine.isPaused);
  }

  private syncScale(): void {
    this.scaleLabel.innerHTML = `<b>${this.ctx.engine.context.time.scale.toFixed(1)}×</b>`;
  }

  refresh(): void {
    // Sample FPS roughly twice a second.
    this.frames++;
    const now = performance.now();
    const span = now - this.lastSampleTime;
    if (span >= 500) {
      this.fps = Math.round((this.frames * 1000) / span);
      this.frames = 0;
      this.lastSampleTime = now;
    }

    const count = this.ctx.world?.entityCount ?? 0;
    this.stats.innerHTML = `<b>${this.fps}</b> fps · <b>${count}</b> entities`;
    this.syncPlay();
  }
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}
