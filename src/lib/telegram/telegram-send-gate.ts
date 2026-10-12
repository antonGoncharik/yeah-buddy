const MAX_CONCURRENT_SENDS = 5;

let active = 0;
const waiters: Array<() => void> = [];

function release(): void {
  active = Math.max(0, active - 1);
  const next = waiters.shift();
  if (next) {
    next();
  }
}

/** Limits concurrent Telegram Bot API calls in one server instance (reminder cron). */
export async function withTelegramSendSlot<T>(
  task: () => Promise<T>,
): Promise<T> {
  await new Promise<void>((resolve) => {
    const start = () => {
      active += 1;
      resolve();
    };
    if (active < MAX_CONCURRENT_SENDS) {
      start();
      return;
    }
    waiters.push(start);
  });

  try {
    return await task();
  } finally {
    release();
  }
}
