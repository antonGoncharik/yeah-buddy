import { createBootHold } from "@/lib/boot-splash";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function queueSchedule() {
  const queued: Array<() => void> = [];
  return {
    flush() {
      const batch = queued.splice(0);
      for (const fn of batch) {
        fn();
      }
    },
    schedule(fn: () => void) {
      queued.push(fn);
      return () => {
        const index = queued.indexOf(fn);
        if (index >= 0) {
          queued.splice(index, 1);
        }
      };
    },
  };
}

{
  const queue = queueSchedule();
  let dismissed = 0;
  const boot = createBootHold(() => {
    dismissed += 1;
  }, queue.schedule);
  const release = boot.hold();
  queue.flush();
  assert(dismissed === 0, "hold keeps splash");
  release();
  queue.flush();
  assert(dismissed === 1, "last release dismisses");
  boot.armIfIdle();
  queue.flush();
  assert(dismissed === 1, "idle after dismiss is a no-op");
}

{
  const queue = queueSchedule();
  let dismissed = 0;
  const boot = createBootHold(() => {
    dismissed += 1;
  }, queue.schedule);
  const first = boot.hold();
  first();
  const second = boot.hold();
  queue.flush();
  assert(dismissed === 0, "next hold cancels pending dismiss");
  second();
  queue.flush();
  assert(dismissed === 1, "final release dismisses once");
}

{
  const queue = queueSchedule();
  let dismissed = 0;
  const boot = createBootHold(() => {
    dismissed += 1;
  }, queue.schedule);
  boot.armIfIdle();
  queue.flush();
  assert(dismissed === 1, "ready with no loaders dismisses");
}

console.log("boot splash ok");
