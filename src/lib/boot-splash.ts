export function createBootHold(
  dismiss: () => void,
  schedule: (fn: () => void) => () => void = (fn) => {
    const timer = setTimeout(fn, 0);
    return () => clearTimeout(timer);
  },
) {
  let count = 0;
  let cancel: (() => void) | null = null;
  let dismissed = false;

  const armIfIdle = () => {
    if (count > 0 || dismissed) {
      return;
    }
    cancel?.();
    cancel = schedule(() => {
      cancel = null;
      if (count === 0 && !dismissed) {
        dismissed = true;
        dismiss();
      }
    });
  };

  const hold = () => {
    count += 1;
    cancel?.();
    cancel = null;
    return () => {
      count -= 1;
      armIfIdle();
    };
  };

  return { hold, armIfIdle };
}
