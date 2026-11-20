import { sha256 } from '../../assets/vendor/sha256.min.mjs';

const SAVE_FORMAT = 'endless-shift-save';
const SAVE_ENVELOPE_VERSION = 1;
const SAVE_KEY_ID = 'web-save-v1';
const SAVE_HMAC_KEY = '6b7690316c1789c12046132ebb9150f3ef5a0ea2ea8ed43751383a9f5a851877';
const SIGNING_DOMAIN = 'endless-shift/save/v1';

function normalize(value) {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('INVALID_SAVE_NUMBER');
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, normalize(value[key])]));
  }
  return value;
}

export function canonicalSaveJson(payload) {
  return JSON.stringify(normalize(payload));
}

function signature(payload) {
  return sha256.hmac.create(SAVE_HMAC_KEY)
    .update(`${SIGNING_DOMAIN}\n${canonicalSaveJson(payload)}`)
    .hex();
}

export function encodeSave(payload) {
  return JSON.stringify({
    format: SAVE_FORMAT,
    version: SAVE_ENVELOPE_VERSION,
    payload,
    integrity: { algorithm: 'HMAC-SHA-256', keyId: SAVE_KEY_ID, value: signature(payload) },
  });
}

export function decodeSave(raw, { allowLegacy = true, allowIntegrityMismatch = false } = {}) {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('INVALID_SAVE');
  if (parsed.format === undefined) {
    if (!allowLegacy) throw new Error('UNSIGNED_SAVE_IMPORT');
    return { payload: parsed, legacy: true };
  }
  if (parsed.format !== SAVE_FORMAT || parsed.version !== SAVE_ENVELOPE_VERSION) throw new Error('INVALID_SAVE_FORMAT');
  if (!parsed.payload || typeof parsed.payload !== 'object' || Array.isArray(parsed.payload)) throw new Error('INVALID_SAVE');
  const integrity = parsed.integrity;
  if (integrity?.algorithm !== 'HMAC-SHA-256' || integrity.keyId !== SAVE_KEY_ID || typeof integrity.value !== 'string') throw new Error('INVALID_SAVE_INTEGRITY');
  const expected = signature(parsed.payload);
  if (integrity.value.length !== expected.length || integrity.value !== expected) {
    if (!allowIntegrityMismatch) throw new Error('SAVE_INTEGRITY_MISMATCH');
    return { payload: parsed.payload, legacy: false, integrityMismatch: true };
  }
  return { payload: parsed.payload, legacy: false };
}
