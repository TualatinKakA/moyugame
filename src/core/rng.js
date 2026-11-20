const MODULUS = 2147483647;
const MAX_VALUE = MODULUS - 1;

function mixSeed(seed, stream) {
  let value = (seed >>> 0) ^ 0x9e3779b9;
  for (let index = 0; index < stream.length; index++) {
    value = Math.imul(value ^ stream.charCodeAt(index), 16777619) >>> 0;
  }
  return normalizeValue(value || 0x6d2b79f5);
}

function normalizeValue(value) {
  if (!Number.isFinite(value)) return 1;
  return ((Math.trunc(value) - 1) % MAX_VALUE + MAX_VALUE) % MAX_VALUE + 1;
}

export function createRngState(seed = 0x6d2b79f5) {
  return { seed: seed >>> 0, streams: {} };
}

export function filterTransientRngStreams(rng, persistence = {}) {
  return {
    seed: rng.seed,
    streams: Object.fromEntries(Object.entries(rng.streams || {}).filter(([stream]) => persistence[stream] !== 'transient')),
  };
}

// Called only inside a Runtime transaction; the transaction journal rolls it back on failure.
export function nextInt(state, stream = 'events') {
  const current = state.rng.streams[stream] || { calls: 0, value: mixSeed(state.rng.seed, stream) };
  const value = normalizeValue(current.value) * 16807 % MODULUS;
  state.rng.streams[stream] = { calls: current.calls + 1, value };
  return value;
}

export function nextDouble(state, stream = 'events') {
  return nextInt(state, stream) / MODULUS;
}

export function nextIntRange(state, stream, min, max) {
  const lower = min - 0.4999;
  const upper = max + 0.4999;
  return Math.round(lower + (upper - lower) * nextDouble(state, stream));
}

export function nextDoubleRange(state, stream, min, max) {
  return min + (max - min) * nextDouble(state, stream);
}

export function randRange(state, stream, min, max) {
  return nextDoubleRange(state, stream, min, max);
}

export function drawRandom(state, stream = 'events') {
  return nextDouble(state, stream);
}
