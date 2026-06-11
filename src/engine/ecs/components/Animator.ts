import type { Component } from "../Component";

/**
 * Flipbook animation over a sprite sheet.
 *
 * Frames are read left-to-right from row `row` of the {@link Sprite}'s image,
 * each `frameWidth`×`frameHeight` pixels. {@link AnimationSystem} advances the
 * frame timer each fixed step and writes the current frame's source rect into
 * the entity's Sprite (`sx`/`sy`/`sw`/`sh`).
 *
 * Load sheets through the {@link AssetLoader} and assign them to
 * `Sprite.image`; the sprite's `width`/`height` still control the rendered
 * world-space size.
 */
export class Animator implements Component {
  /** Source frame size within the sheet, in pixels. */
  frameWidth: number;
  frameHeight: number;
  /** Number of frames in the row. */
  frameCount: number;
  /** Playback speed, frames per second. */
  fps: number;
  /** Which row of the sheet to play (each row is one animation). */
  row: number;
  /** Loop when the last frame ends; otherwise hold on it. */
  loop: boolean;
  playing = true;

  /** Playback state (managed by AnimationSystem). */
  time = 0;
  frame = 0;

  constructor(opts: {
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    fps?: number;
    row?: number;
    loop?: boolean;
  }) {
    this.frameWidth = opts.frameWidth;
    this.frameHeight = opts.frameHeight;
    this.frameCount = Math.max(1, opts.frameCount);
    this.fps = opts.fps ?? 10;
    this.row = opts.row ?? 0;
    this.loop = opts.loop ?? true;
  }

  /** Switch to a different row/animation and restart playback. */
  play(row: number, frameCount = this.frameCount, fps = this.fps): void {
    this.row = row;
    this.frameCount = Math.max(1, frameCount);
    this.fps = fps;
    this.time = 0;
    this.frame = 0;
    this.playing = true;
  }
}
