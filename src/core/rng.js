function mixSeed(seed, stream) {
  let value = (seed >>> 0) ^ 0x9e3779b9;
  for (let index = 0; index < stream.length; index++) {
    value = Math.imul(value ^ stream.charCodeAt(index), 16777619) >>> 0;
  }
  return value || 0x6d2b79f5;
}

export function createRngState(seed = 0x6d2b79f5) {
  return { seed: seed >>> 0, streams: {} };
}

// Called only inside a Runtime transaction; the transaction journal rolls it back on failure.
export function drawRandom(state, stream = 'events') {
  const current = state.rng.streams[stream] || { calls: 0, value: mixSeed(state.rng.seed, stream) };
  let value = (current.value + 0x6d2b79f5) >>> 0;
  let mixed = value;
  mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
  const result = ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  state.rng.streams[stream] = { calls: current.calls + 1, value };
  return result;
}
