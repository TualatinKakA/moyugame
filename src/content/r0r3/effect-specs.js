const LEGACY_FORMULA_REPAIRS = Object.freeze({
  GB6: '(0.75 * log10(1 + x) ^ 1.25)%',
  UD7: '(0.75 * x ^ 0.75)%',
  DD3: '(0.4 * x ^ 0.4)%',
  DN9: '(2 * ln(1 + x) ^ 2)%',
  DW3: '(2 * log10(1 + x) ^ 2)%',
});

const GLOBAL = { type: 'global' };
const ALL = { type: 'allBuildings' };
const LOW3 = { type: 'buildings', ids: ['farm', 'inn', 'blacksmith'] };
const building = id => ({ type: 'building', id });
const alignment = id => ({ type: 'alignment', id });
const highestTiers = { type: 'highestTiers', count: 3 };
const eachBuilding = { type: 'eachBuilding' };
const eachNonUnique = { type: 'eachBuilding', includeUnique: false };
const alignmentTier = tier => ({ type: 'alignmentTier', tier });

const value = constant => ({ constant });
const formula = (formulaIndex, variables = { x: 'buildings.total' }) => ({ formulaIndex, variables });
const inline = (expression, variables) => ({ formula: expression, variables });
const effect = (stat, operation, effectValue, target = GLOBAL, phase = 'global') => ({
  stat, operation, value: effectValue, target, phase,
});

const definitions = {
  FR1: [
    effect('building.baseProduction', 'add', value(98), building('farm'), 'buildingBase'),
    effect('building.costMultiplier', 'add', value(-0.02), ALL, 'utility'),
  ],
  FR2: [effect('building.production', 'addPercent', value(10000), LOW3, 'buildingLocal')],
  FR3: [effect('mana.max', 'add', formula(0, { x: 'buildings.alignment.good' }), GLOBAL, 'mana')],
  FR5: [
    effect('building.baseProduction', 'add', value(234), building('inn'), 'buildingBase'),
    effect('building.costMultiplier', 'add', value(-0.02), ALL, 'utility'),
  ],
  FR6: [effect('special', 'unlock', value('goldenPots'), GLOBAL, 'raw')],
  FR7: [effect('mana.regen', 'add', formula(0, { x: 'buildings.blacksmith' }), GLOBAL, 'mana')],
  FR9: [
    effect('building.baseProduction', 'add', value(580), building('blacksmith'), 'buildingBase'),
    effect('building.costMultiplier', 'add', value(-0.02), ALL, 'utility'),
  ],
  FR10: [effect('global.production', 'addPercent', formula(0, { x: 'buildings.low3' }))],
  FR11: [effect('assistants.count', 'add', formula(0, { x: 'buildings.low3' }), GLOBAL, 'assistants')],
  FR12: [effect('global.production', 'addPercent', inline('0.075 * x', { x: 'buildings.low3' }))],

  EL1: [effect('factionCoin.chance', 'multiplyPercent', value(150), GLOBAL, 'factionCoin')],
  EL2: [
    effect('click.reward', 'add', inline('25000 * x', { x: 'trophies' }), GLOBAL, 'click'),
    effect('factionCoin.chance', 'addPercent', formula(0, { x: 'trophies' }), GLOBAL, 'factionCoin'),
  ],
  EL3: [effect('mana.regen', 'add', formula(0, { x: 'clicks.r' }), GLOBAL, 'mana')],
  EL5: [
    effect('click.reward', 'multiplyPercent', formula(0, { x: 'buildings.alignment.good' }), GLOBAL, 'click'),
    effect('special', 'unlock', value('elvenEmissary'), GLOBAL, 'raw'),
  ],
  EL6: [effect('exchange.bonus', 'addPercent', formula(0, { x: 'factionCoins.total' }))],
  EL7: [effect('global.production', 'addPercent', formula(0, { x: 'clicks.r' }))],
  EL9: [effect('click.count', 'multiplyPercent', formula(0, { x: 'factionCoins.total' }), GLOBAL, 'click')],
  EL10: [effect('special', 'unlock', value('elvenLuck'), GLOBAL, 'raw')],
  EL11: [effect('special', 'unlock', value('sylvanTreasure'), GLOBAL, 'raw')],
  EL12: [
    effect('factionCoin.chance', 'addPercent', value(5), GLOBAL, 'factionCoin'),
    effect('click.reward', 'multiplyPercent', formula(0, { x: 'derived.fcChance' }), GLOBAL, 'click'),
  ],

  AN1: [effect('mana.regen', 'add', formula(0), GLOBAL, 'mana')],
  AN2: [
    effect('global.production', 'addPercent', formula(0, { x: 'spells.total' })),
    effect('factionCoin.reward', 'multiplyPercent', value(500), { type: 'faction', id: 'angel' }, 'utility'),
  ],
  AN3: [effect('factionCoin.chance', 'addPercent', formula(0, { x: 'activeSpells' }), GLOBAL, 'factionCoin')],
  AN5: [effect('spell.castCount', 'multiplyPercent', value(100), GLOBAL, 'utility')],
  AN6: [effect('spell.cost', 'multiply', value(0.5), GLOBAL, 'utility')],
  AN7: [effect('mana.regen', 'multiplyPercent', value(50), GLOBAL, 'mana')],
  AN9: [effect('mana.max', 'add', formula(0, { x: 'time.faction.r.good' }), GLOBAL, 'mana')],
  AN10: [effect('spell.duration', 'multiplyPercent', value(50), GLOBAL, 'utility')],
  AN11: [effect('global.production', 'addPercent', formula(0, { x: 'derived.manaRegen' }))],
  AN12: [effect('mana.regen', 'multiplyPercent', value(10), GLOBAL, 'mana')],

  GB1: [effect('assistants.count', 'add', formula(0, { x: 'factionCoins.total' }), GLOBAL, 'assistants')],
  GB2: [effect('global.production', 'addPercent', formula(0, { x: 'buildings.alignment.evil' }))],
  GB3: [effect('taxCollection.seconds', 'add', formula(0), GLOBAL, 'raw')],
  GB5: [
    effect('gem.power', 'multiplyPercent', value(150), GLOBAL, 'utility'),
    effect('offline.production', 'addPercent', formula(0, { x: 'taxCasts.total' }), GLOBAL, 'utility'),
  ],
  GB6: [effect('mana.regen', 'multiplyPercent', formula(0, { x: 'coins' }), GLOBAL, 'mana')],
  GB7: [effect('global.production', 'addPercent', formula(0, { x: 'taxCollection.seconds' }))],
  GB9: [effect('special', 'unlock', value('goblinBank'), GLOBAL, 'raw')],
  GB10: [effect('factionCoin.chance', 'addPercent', formula(0, { x: 'buildings.max.witchConclave' }), GLOBAL, 'factionCoin')],
  GB11: [effect('special', 'unlock', value('greenFingers'), GLOBAL, 'raw')],
  GB12: [effect('global.production', 'addPercent', formula(0, { x: 'gems' }))],

  UD1: [effect('factionCoin.chance', 'addPercent', formula(0, { x: 'derived.assistants' }), GLOBAL, 'factionCoin')],
  UD2: [effect('global.production', 'addPercent', formula(0, { x: 'buildings.max.necropolis' }))],
  UD3: [effect('mana.regen', 'add', formula(0, { x: 'buildings.max.necropolis' }), GLOBAL, 'mana')],
  UD5: [effect('offline.production', 'addPercent', formula(0, { x: 'offline.r' }), GLOBAL, 'utility')],
  UD6: [effect('assistants.count', 'add', formula(0, { x: 'offline.r' }), GLOBAL, 'assistants')],
  UD7: [effect('global.production', 'addPercent', formula(0, { x: 'time.total' }))],
  UD9: [effect('building.count', 'multiplyPercent', value(75), ALL, 'buildingLocal')],
  UD10: [effect('assistants.production', 'addPercent', value(1500), GLOBAL, 'global')],
  UD11: [effect('offline.production', 'addPercent', formula(0, { x: 'derived.manaRegen' }), GLOBAL, 'utility')],
  UD12: [effect('assistants.count', 'add', formula(0, { x: 'time.totalWithUndeadChallenge' }), GLOBAL, 'assistants')],

  DM1: [effect('building.production', 'addPercent', formula(0, { x: 'derived.assistants' }), alignmentTier(9), 'buildingLocal')],
  DM2: [effect('building.count', 'multiplyPercent', formula(0, { x: 'time.faction.r.evil' }), highestTiers, 'buildingLocal')],
  DM3: [effect('global.production', 'addPercent', formula(0, { x: 'buildings.max.hellPortal' }))],
  DM5: [
    effect('building.baseProduction', 'add', value(200000), building('evilFortress'), 'buildingBase'),
    effect('building.baseProduction', 'add', value(2000000), building('hellPortal'), 'buildingBase'),
    effect('time.playtime', 'add', value(21600), GLOBAL, 'raw'),
  ],
  DM6: [effect('building.production', 'addPercent', formula(0, { x: 'trophies' }), highestTiers, 'buildingLocal')],
  DM7: [effect('mana.max', 'add', formula(0, { x: 'spells.evilTotal' }), GLOBAL, 'mana')],
  DM9: [effect('mana.regen', 'add', formula(0, { x: 'buildings.hellPortal' }), GLOBAL, 'mana')],
  DM10: [effect('assistants.count', 'add', formula(0, { x: 'buildings.hellPortal' }), GLOBAL, 'assistants')],
  DM11: [effect('building.production', 'addPercent', formula(0, { x: 'buildings.max.hellPortal' }), alignmentTier(10), 'buildingLocal')],
  DM12: [effect('global.production', 'addPercent', inline('0.3 * x', { x: 'buildings.hallOfLegends' }))],

  TT1: [effect('global.production', 'addPercent', formula(0))],
  TT2: [effect('mana.regen', 'multiplyPercent', formula(0, { x: 'clicks.total' }), GLOBAL, 'mana')],
  TT3: [effect('factionCoin.chance', 'addPercent', formula(0, { x: 'time.faction.r.neutral' }), GLOBAL, 'factionCoin')],
  TT5: [
    effect('building.baseProduction', 'add', value(9635), alignmentTier(4), 'buildingBase'),
    effect('building.baseProduction', 'add', value(98000), alignmentTier(7), 'buildingBase'),
    effect('building.production', 'addPercent', value(1000), { type: 'alignmentTiers', tiers: [4, 7] }, 'buildingLocal'),
  ],
  TT6: [effect('global.production', 'addPercent', formula(0, { x: 'activeSpells' }))],
  TT7: [effect('building.production', 'addPercent', formula(0, { x: 'derived.assistants' }), building('hallOfLegends'), 'buildingLocal')],
  TT9: [
    effect('assistants.count', 'multiplyPercent', value(200), GLOBAL, 'assistants'),
    effect('assistants.production', 'addPercent', value(200), GLOBAL, 'global'),
  ],
  TT10: [
    effect('exchange.bonus', 'addPercent', value(100)),
    effect('exchange.costMultiplier', 'add', value(-0.01), ALL, 'utility'),
  ],
  TT11: [
    effect('building.costMultiplier', 'add', value(-0.01), building('hallOfLegends'), 'utility'),
    effect('assistants.production', 'addPercent', formula(0, { x: 'buildings.hallOfLegends' }), GLOBAL, 'global'),
  ],
  TT12: [effect('exchange.bonus', 'addPercent', value(15))],

  DD1: [effect('building.production', 'addPercent', formula(0, { T: 'target.tier' }), eachBuilding, 'buildingLocal')],
  DD2: [effect('assistants.count', 'add', formula(0, { x: 'time.total' }), GLOBAL, 'assistants')],
  DD3: [
    effect('factionCoin.chance', 'addPercent', formula(0), GLOBAL, 'factionCoin'),
    effect('factionCoin.chance', 'multiplyPercent', formula(0), GLOBAL, 'factionCoin'),
  ],
  DD5: [effect('mana.max', 'add', formula(0, { x: 'buildings.max.stonePillars' }), GLOBAL, 'mana')],
  DD6: [effect('global.production', 'addPercent', formula(0, { x: 'derived.manaMax' }))],
  DD7: [effect('mana.regen', 'add', formula(0, { x: 'derived.assistants' }), GLOBAL, 'mana')],
  DD9: [effect('building.production', 'addPercent', formula(0, { T: 'target.tier' }), eachNonUnique, 'buildingLocal')],
  DD10: [effect('mana.regen', 'add', formula(0, { x: 'buildings.max.stonePillars' }), GLOBAL, 'mana')],
  DD11: [effect('building.production', 'addPercent', formula(0, { x: 'target.count' }), eachBuilding, 'buildingLocal')],
  DD12: [effect('mana.max', 'add', inline('x / 15', { x: 'buildings.total' }), GLOBAL, 'mana')],

  FC1: [effect('building.production', 'addPercent', formula(0, { x: 'derived.assistants' }), alignmentTier(8), 'buildingLocal')],
  FC2: [effect('factionCoin.chance', 'addPercent', formula(0, { x: 'buildings.max.labyrinth' }), GLOBAL, 'factionCoin')],
  FC3: [effect('assistants.count', 'multiplyPercent', formula(0, { x: 'time.longestSession.r' }), GLOBAL, 'assistants')],
  FC5: [effect('building.production', 'addPercent', formula(0, { x: 'coins' }), alignment('neutral'), 'buildingLocal')],
  FC6: [effect('assistants.count', 'add', formula(0), GLOBAL, 'assistants')],
  FC7: [effect('global.production', 'addPercent', formula(0, { x: 'buildings.maxTotal.r' }))],
  FC9: [effect('mana.regen', 'add', formula(0, { x: 'derived.assistants' }), GLOBAL, 'mana')],
  FC10: [effect('assistants.production', 'addPercent', formula(0, { x: 'activeSpells' }), GLOBAL, 'global')],
  FC11: [effect('global.production', 'addPercent', formula(0, { x: 'time.faction.total.faceless' }))],
  FC12: [effect('global.production', 'addPercent', formula(0, { x: 'buildings.maxTotal.total' }))],

  DN1: [effect('factionCoin.chance', 'addPercent', formula(0, { x: 'buildings.blacksmith' }), GLOBAL, 'factionCoin')],
  DN2: [effect('building.costMultiplier', 'add', value(-0.01), ALL, 'utility')],
  DN3: [effect('global.production', 'addPercent', formula(0, { x: 'excavations.r', y: 'excavationResets' }))],
  DN5: [effect('mana.regen', 'multiplyPercent', formula(0, { x: 'gems' }), GLOBAL, 'mana')],
  DN6: [effect('click.reward', 'multiplyPercent', formula(0), GLOBAL, 'click')],
  DN7: [effect('assistants.production', 'addPercent', formula(0, { x: 'time.total' }), GLOBAL, 'global')],
  DN9: [effect('global.production', 'addPercent', formula(0, { x: 'factionCoins.dwarf' }))],
  DN10: [effect('excavation.costMultiplier', 'add', value(-0.02), GLOBAL, 'utility')],
  DN11: [effect('mana.max', 'add', formula(0, { x: 'derived.longestSpellDuration' }), GLOBAL, 'mana')],
  DN12: [effect('global.production', 'addPercent', formula(0, { x: 'excavations.total' }))],

  DW1: [effect('global.production', 'addPercent', formula(0, { x: 'time.faction.r.evil' }))],
  DW2: [effect('factionCoin.chance', 'addPercent', formula(0, { x: 'derived.assistants' }), GLOBAL, 'factionCoin')],
  DW3: [effect('global.production', 'addPercent', formula(0, { x: 'derived.manaMax' }))],
  DW5: [effect('mana.regen', 'add', formula(0, { x: 'time.total' }), GLOBAL, 'mana')],
  DW6: [effect('global.production', 'addPercent', formula(0, { x: 'buildings.max.darkTemple' }))],
  DW7: [effect('exchange.costMultiplier', 'add', value(-0.02), ALL, 'utility')],
  DW9: [effect('assistants.count', 'multiplyPercent', formula(0), GLOBAL, 'assistants')],
  DW10: [effect('gem.power', 'multiplyPercent', formula(0, { x: 'exchanges.total' }), GLOBAL, 'utility')],
  DW11: [effect('global.production', 'addPercent', formula(0, { x: 'comboCasts.total' }))],
  DW12: [effect('assistants.production', 'addPercent', formula(0, { x: 'exchanges.total' }), GLOBAL, 'global')],
};

function targetKey(target) {
  return target.id || target.ids?.join(',') || target.tier || target.tiers?.join(',') || target.type;
}

export function getFactionEffectSpecs(upgrade) {
  const specs = definitions[upgrade.code];
  if (!specs) {
    if (/^(FR|EL|AN|GB|UD|DM|TT|DD|FC|DN|DW)(0|4|8)$/.test(upgrade.code)) return [];
    throw new Error(`Missing EffectSpec for ${upgrade.id} (${upgrade.code})`);
  }
  return specs.map((spec, index) => ({
    ...spec,
    id: `${upgrade.id}:${index}`,
    source: upgrade.id,
    stackingGroup: `${spec.stat}:${targetKey(spec.target)}:${spec.operation}`,
    value: spec.value.formulaIndex === undefined ? spec.value : {
      formula: LEGACY_FORMULA_REPAIRS[upgrade.code] || upgrade.formulas[spec.value.formulaIndex],
      variables: spec.value.variables,
    },
  }));
}

export const FACTION_EFFECT_CODES = Object.freeze(Object.keys(definitions));
