import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, normalizeState, saveState, loadState, SAVE_KEY,
  CURRENT_SCHEMA_VERSION,
} from '../src/core/state.js';
import { tick, workClick, abdicate, reincarnate, reincarnationRequirement } from '../src/systems/engine.js';

test('new save schema separates content, R/A progression and time scopes', () => {
  const s = createState();
  assert.equal(s.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.deepEqual(s.contentPacks, ['r0-r3-v1']);
  assert.equal(s.progression.reincarnations, 0);
  assert.equal(s.progression.ascension, 0);
  assert.deepEqual(s.progression.ascensionHistory, []);
  assert.ok(s.stats.run && s.stats.r && s.stats.ascension && s.stats.total);
  assert.ok(s.createdAt <= Date.now());
  assert.ok(s.sessionStartedAt <= Date.now());
});

test('current R0-R3 save migrates without reading the demo save', () => {
  const legacy = createState();
  delete legacy.schemaVersion;
  delete legacy.progression;
  legacy.reincarnations = 3;
  legacy.createdAt = 123456;
  legacy.stats.run.coins = 500;
  const migrated = normalizeState(JSON.parse(JSON.stringify(legacy)));
  assert.equal(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(migrated.progression.reincarnations, 3);
  assert.equal(migrated.stats.run.coins, 500);
  assert.equal(migrated.createdAt, 123456);
  assert.ok(migrated.sessionStartedAt > 123456);
  assert.deepEqual(migrated.contentPacks, ['r0-r3-v1']);
});

test('loadState never falls back to the demo key', () => {
  const storage = { getItem: key => key === 'endless-shift-demo-v1' ? '{"coins":999999}' : null };
  const s = loadState(storage);
  assert.equal(s.coins, 0);
  assert.equal(s.schemaVersion, CURRENT_SCHEMA_VERSION);
});

test('saved JSON contains progression but excludes derived calculation cache', () => {
  const s = createState();
  s.progression.reincarnations = 2;
  s._derived = { production: 1000, mods: { globalAdd: 50 } };
  const memory = new Map();
  const storage = { setItem: (k, v) => memory.set(k, v), getItem: k => memory.get(k) };
  saveState(s, storage);
  const raw = JSON.parse(memory.get(SAVE_KEY));
  assert.equal(raw.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(raw.progression.reincarnations, 2);
  assert.equal(raw._derived, undefined);
  assert.equal(normalizeState(raw).progression.reincarnations, 2);
});

test('Ascension-scope stats receive clicks, time and production', () => {
  const s = createState();
  workClick(s); tick(s, 0.5);
  assert.equal(s.stats.ascension.clicks, 1);
  assert.equal(s.stats.ascension.time, 0.5);
  assert.equal(s.stats.ascension.coins, 1);
});

test('R/A metadata and A-scope stats survive abdication and reincarnation', () => {
  let s = createState();
  s.progression.ascension = 1;
  s.progression.ascensionStartR = 40;
  s.progression.ascensionHistory = [{ from: 0, to: 1, atR: 39 }];
  s.stats.ascension.time = 1234;
  const history = s.progression.ascensionHistory;
  const aStats = s.stats.ascension;
  s = abdicate(s);
  assert.equal(s.progression.ascension, 1);
  assert.equal(s.stats.ascension, aStats);
  s.gems = reincarnationRequirement(s.progression.reincarnations);
  s = reincarnate(s);
  assert.equal(s.progression.reincarnations, 1);
  assert.equal(s.progression.ascension, 1);
  assert.equal(s.progression.ascensionStartR, 40);
  assert.deepEqual(s.progression.ascensionHistory, history);
  assert.equal(s.stats.ascension, aStats);
});

test('invalid JSON falls back to a clean schema without throwing', () => {
  const storage = { getItem: () => '{broken' };
  const s = loadState(storage);
  assert.equal(s.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(s.progression.reincarnations, 0);
});
