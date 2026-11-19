import { BUILDING_DEFINITIONS, BUILDING_UPGRADE_DEFINITIONS } from '../definitions/buildings.js';
import { ALIGNMENT_DEFINITIONS, FACTION_DEFINITIONS, FACTION_UPGRADE_DEFINITIONS } from '../definitions/factions.js';
import { SPELL_DEFINITIONS } from '../definitions/spells.js';
import { TROPHY_DEFINITIONS } from '../definitions/trophies.js';
import { STORY_DEFINITIONS } from '../definitions/stories.js';
import { GENERAL_UPGRADE_DEFINITIONS } from '../definitions/upgrades.js';
import { INFLUENCE_FACTION_DEFINITIONS } from '../definitions/influence-factions.js';

export const BASE_PACK = Object.freeze({
  id: 'base', version: 'base-v1',
  definitions: Object.freeze([
    ...BUILDING_DEFINITIONS, ...BUILDING_UPGRADE_DEFINITIONS,
    ...ALIGNMENT_DEFINITIONS, ...FACTION_DEFINITIONS, ...INFLUENCE_FACTION_DEFINITIONS, ...FACTION_UPGRADE_DEFINITIONS,
    ...GENERAL_UPGRADE_DEFINITIONS,
    ...SPELL_DEFINITIONS, ...TROPHY_DEFINITIONS, ...STORY_DEFINITIONS,
  ]),
});
