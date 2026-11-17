const handlers = new Map();

function assertEventType(type) {
  if (typeof type !== 'string' || !type.trim()) throw new TypeError('Event type must be a non-empty string');
}

function serializableData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new TypeError('Event payload must be a plain object');
  }
  const serialized = JSON.stringify(data);
  if (serialized === undefined) throw new TypeError('Event payload must be serializable');
  return JSON.parse(serialized);
}

export function subscribeGameEvent(type, handler) {
  assertEventType(type);
  if (typeof handler !== 'function') throw new TypeError('Event handler must be a function');
  const listeners = handlers.get(type) || new Set();
  listeners.add(handler);
  handlers.set(type, listeners);
  return () => {
    listeners.delete(handler);
    if (!listeners.size) handlers.delete(type);
  };
}

export function emitGameEvent(type, payload = {}) {
  assertEventType(type);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('Event payload must be an object');
  }
  const event = Object.freeze({
    type,
    at: Number.isFinite(payload.at) ? payload.at : Date.now(),
    data: serializableData(payload.data || payload),
  });
  const listeners = [...(handlers.get(type) || []), ...(handlers.get('*') || [])];
  for (const handler of listeners) handler(event);
  return event;
}

export function clearGameEventHandlers() {
  handlers.clear();
}
