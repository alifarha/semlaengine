/**
 * Loads and caches images (and, later, audio buffers).
 *
 * Preload everything during a loading screen, then access synchronously from
 * systems via {@link image}. The scaffold's demo runs without any assets, so
 * this is here for when you start adding art.
 */
export class AssetLoader {
  private readonly images = new Map<string, HTMLImageElement>();

  async loadImage(key: string, url: string): Promise<HTMLImageElement> {
    const existing = this.images.get(key);
    if (existing) return existing;

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Semla: failed to load image "${url}"`));
      img.src = url;
    });

    this.images.set(key, image);
    return image;
  }

  /** Load many images in parallel. */
  async loadImages(entries: Record<string, string>): Promise<void> {
    await Promise.all(
      Object.entries(entries).map(([key, url]) => this.loadImage(key, url)),
    );
  }

  /** Get a preloaded image, or undefined if it was never loaded. */
  image(key: string): HTMLImageElement | undefined {
    return this.images.get(key);
  }
}
