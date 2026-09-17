type Listener = (message: string | null) => void;

const listeners = new Set<Listener>();

export function subscribeActionError(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function reportActionError(message: string): void {
  for (const listener of listeners) {
    listener(message);
  }
}

export function clearActionError(): void {
  for (const listener of listeners) {
    listener(null);
  }
}
