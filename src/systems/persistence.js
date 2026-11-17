export const SAVE_KEY = 'endless-shift-r0r3-v1';
export const BACKUP_KEY = 'endless-shift-v4-backup';
export const CORRUPT_KEY = 'endless-shift-v4-corrupt';

export function createSaveAdapter({ storage = globalThis.localStorage, key = SAVE_KEY } = {}) {
  const backupKey = `${key}:previous`;
  const corruptKey = `${key}:corrupt`;
  return Object.freeze({
    load() {
      const main = storage.getItem(key);
      const backup = storage.getItem(backupKey);
      const valid = raw => {
        if (!raw) return null;
        try { const parsed = JSON.parse(raw); return parsed && typeof parsed === 'object' ? raw : null; } catch { return null; }
      };
      const validMain = valid(main);
      if (main && !validMain) storage.setItem(corruptKey, main);
      return { raw: validMain || valid(backup), recovered: !validMain && Boolean(valid(backup)), corruptedRaw: main && !validMain ? main : null };
    },
    save(state) {
      const serialized = JSON.stringify(state);
      const previous = storage.getItem(key);
      if (previous) storage.setItem(backupKey, previous);
      storage.setItem(key, serialized);
      return serialized;
    },
    backup(raw) { if (raw) storage.setItem(backupKey, raw); },
    import(raw) {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') throw new Error('INVALID_SAVE');
      const previous = storage.getItem(key);
      if (previous) storage.setItem(backupKey, previous);
      storage.setItem(key, raw);
    },
    remove() { storage.removeItem(key); storage.removeItem(backupKey); storage.removeItem(corruptKey); },
    listSlots() { return { main: storage.getItem(key), backup: storage.getItem(backupKey), corrupt: storage.getItem(corruptKey) }; },
  });
}

export function createMemoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key),
    dump: () => Object.fromEntries(data),
  };
}

export function createPersistence(adapter, { wallNow = () => Date.now() } = {}) {
  let saveDirty = false;
  let lastSaveError = null;
  let retryDelay = 1000;
  let nextRetryAt = 0;
  function save(state) {
    try {
      adapter.save(state);
      saveDirty = false; lastSaveError = null; retryDelay = 1000; nextRetryAt = 0;
      return { ok: true };
    } catch (error) {
      saveDirty = true; lastSaveError = error; nextRetryAt = wallNow() + retryDelay;
      retryDelay = Math.min(30000, retryDelay * 2);
      return { ok: false, error };
    }
  }
  return Object.freeze({
    markDirty() { saveDirty = true; },
    save,
    tick(state, now = wallNow()) { if (saveDirty && lastSaveError && now >= nextRetryAt) return save(state); return null; },
    get saveDirty() { return saveDirty; },
    get lastSaveError() { return lastSaveError; },
  });
}
