import { withTelegramSendSlot } from "@/lib/telegram/telegram-send-gate";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

export default (async () => {
  let peak = 0;
  let running = 0;

  async function slot(ms: number): Promise<number> {
    return withTelegramSendSlot(async () => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, ms));
      running -= 1;
      return peak;
    });
  }

  const peaks = await Promise.all([
    slot(30),
    slot(30),
    slot(30),
    slot(30),
    slot(30),
    slot(30),
    slot(30),
    slot(30),
  ]);

  assert(Math.max(...peaks) <= 5, "never more than 5 concurrent");
})();
