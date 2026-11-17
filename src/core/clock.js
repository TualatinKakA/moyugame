export function createClock({ wallNow = () => Date.now(), monotonicNow = () => performance.now() } = {}) {
  return Object.freeze({ wallNow, monotonicNow });
}

export const systemClock = createClock();
