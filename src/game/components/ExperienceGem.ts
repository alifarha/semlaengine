import type { Component } from "@engine";

/** A pickup dropped by dead enemies that grants experience when collected. */
export class ExperienceGem implements Component {
  /** True once inside magnet range — then it accelerates toward the player. */
  attracted = false;

  constructor(public value = 1) {}
}
