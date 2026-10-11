/** Run async work over items with a fixed concurrency limit. */
export async function mapWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) {
    return;
  }
  const limit = Math.max(1, Math.min(concurrency, items.length));
  let index = 0;

  async function run(): Promise<void> {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      if (current === undefined) {
        return;
      }
      await worker(current);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => run()));
}
