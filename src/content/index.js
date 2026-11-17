import { BASE_PACK } from './packs/base.js';

// Content update entry point: a future pack changes this manifest, not the engine or UI.
export const CONTENT_PACKS = Object.freeze([BASE_PACK]);
export const CONTENT = Object.freeze({
  packs: CONTENT_PACKS,
  definitions: Object.freeze(CONTENT_PACKS.flatMap(pack => pack.definitions)),
});
