type Handler<T> = (payload: T) => void;

/**
 * A minimal typed pub/sub emitter.
 *
 * Define an event map and get type-safe `on`/`emit`. Used for decoupled
 * gameplay events such as "enemyKilled", "playerLevelUp", or "gemCollected"
 * so systems and UI can react without referencing each other directly.
 *
 * @example
 *   type GameEvents = { enemyKilled: { xp: number }; playerDied: void };
 *   const events = new EventEmitter<GameEvents>();
 *   events.on("enemyKilled", ({ xp }) => addXp(xp));
 */
export class EventEmitter<Events extends Record<string, unknown>> {
  private handlers = new Map<keyof Events, Set<Handler<unknown>>>();

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<unknown>);
    // Return an unsubscribe function for convenient cleanup.
    return () => this.off(event, handler);
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    this.handlers.get(event)?.delete(handler as Handler<unknown>);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const handler of set) {
      (handler as Handler<Events[K]>)(payload);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
