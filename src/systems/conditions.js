const DEFAULT_BASIC_FACTIONS = new Set(['fairy', 'elf', 'angel', 'goblin', 'undead', 'demon']);

function copyStats(stats = {}) {
  return Object.fromEntries(['run', 'r', 'ascension', 'total'].map(scope => [scope, {
    ...(stats[scope] || {}),
    factionTime: { ...(stats[scope]?.factionTime || {}) },
    factionCoinsByFaction: { ...(stats[scope]?.factionCoinsByFaction || {}) },
    buildingMax: { ...(stats[scope]?.buildingMax || {}) },
    upgradesByFaction: { ...(stats[scope]?.upgradesByFaction || {}) },
  }]));
}

export function createCompatibilitySnapshot(state = {}) {
  return {
    coins: Number(state.coins) || 0,
    gems: Number(state.gems) || 0,
    rubies: Number(state.rubies) || 0,
    mana: Number(state.mana) || 0,
    faction: state.faction ?? null,
    alignment: state.alignment ?? null,
    prestige: state.prestige ?? null,
    buildings: { ...(state.buildings || {}) },
    factionCoins: { ...(state.factionCoins || {}) },
    activeSpells: { ...(state.activeSpells || {}) },
    progression: { ...(state.progression || {}) },
    stats: copyStats(state.stats),
    story: state.story,
    achievements: state.achievements,
    trophyConditions: { ...(state.trophyConditions || {}) },
    retirement: state.retirement ? { ...state.retirement } : undefined,
    firstRetirementEligible: state.firstRetirementEligible,
    cycles: state.cycles ? { ...state.cycles } : undefined,
    runId: state.runId,
  };
}

export function resolveSnapshot(state, computeSnapshot) {
  if (computeSnapshot !== undefined && typeof computeSnapshot !== 'function') {
    throw new TypeError('computeSnapshot must be a function');
  }
  return computeSnapshot ? computeSnapshot(state) : createCompatibilitySnapshot(state);
}

function totalClicks(context) {
  return context.event?.data?.totalClicks ?? context.snapshot?.stats?.total?.clicks;
}

function firstRetirement(context) {
  const data = context.event?.data || {};
  return data.firstRetirement === true || data.previousAbdications === 0 || context.snapshot?.stats?.total?.abdications === 1;
}

function reincarnationAtLeast(count) {
  return ({ snapshot }) => (Number(snapshot?.progression?.reincarnations) || 0) >= count;
}

function trophyCondition(id) {
  return ({ snapshot }) => snapshot?.trophyConditions?.[id] === true;
}

const defaultConditions = {
  always: () => true,
  newSaveStarted: ({ event }) => event?.type === 'game.started' && event.data?.isNewSave === true,
  firstEffectiveWorkClick: context => context.event?.type === 'work.clicked'
    && context.event.data?.success !== false && totalClicks(context) === 1,
  firstBasicDepartment: ({ event }) => event?.type === 'faction.joined'
    && DEFAULT_BASIC_FACTIONS.has(event.data?.factionId)
    && event.data?.basic !== false,
  firstRetirementGuidance: ({ snapshot }) => snapshot?.story?.intro?.completed !== true && (
    snapshot?.retirement?.guidanceEligible === true
    || snapshot?.firstRetirementEligible === true
    || snapshot?.derived?.firstRetirementEligible === true
  ),
  firstRetirementCompleted: context => context.event?.type === 'abdication.completed'
    && context.event.data?.saved === true && firstRetirement(context),
  runCoinsAtLeast1Oc: ({ event, snapshot }) => Number(
    event?.data?.runCoins ?? snapshot?.stats?.run?.coins,
  ) >= 1e27,
  reincarnationAtLeast1: reincarnationAtLeast(1),
  reincarnationAtLeast3: reincarnationAtLeast(3),
  reincarnationAtLeast7: reincarnationAtLeast(7),
  reincarnationAtLeast15: reincarnationAtLeast(15),
  reincarnationAtLeast40: reincarnationAtLeast(40),
  reincarnationAtLeast100: reincarnationAtLeast(100),
  reincarnationAtLeast150: reincarnationAtLeast(150),
  ascensionAtLeast1: ({ snapshot }) => (Number(snapshot?.progression?.ascension) || 0) >= 1,
};

const legacyTrophyConditions = [
  'coinPillage', 'fairyChoir', 'sunBlessing', 'godsRest', 'greedDrive', 'trueNight',
  'hellRush', 'lightningStorm', 'hallsBalance', 'facelessOvermind', 'minedwarf', 'perfectCombo',
];
for (const id of legacyTrophyConditions) {
  defaultConditions[`trophyCondition${id[0].toUpperCase()}${id.slice(1)}`] = trophyCondition(id);
}

export function createConditionRegistry({ includeDefaults = true } = {}) {
  const definitions = new Map();

  function registerCondition(id, predicate, { override = false } = {}) {
    if (typeof id !== 'string' || !id) throw new TypeError('Condition ID must be a non-empty string');
    if (typeof predicate !== 'function') throw new TypeError(`Condition ${id} must be a function`);
    if (definitions.has(id) && !override) throw new Error(`Condition already registered: ${id}`);
    definitions.set(id, predicate);
    return predicate;
  }

  function assertCondition(expression) {
    if (typeof expression === 'string') {
      if (!definitions.has(expression)) throw new Error(`Unknown condition: ${expression}`);
      return;
    }
    if (!expression || typeof expression !== 'object' || Array.isArray(expression)) {
      throw new TypeError('Condition must be an ID or an all/any/not expression');
    }
    const keys = Object.keys(expression);
    if (keys.length !== 1 || !['all', 'any', 'not'].includes(keys[0])) {
      throw new TypeError('Condition expression must contain exactly one of all, any or not');
    }
    if (keys[0] === 'not') return assertCondition(expression.not);
    if (!Array.isArray(expression[keys[0]])) throw new TypeError(`${keys[0]} condition must be an array`);
    for (const child of expression[keys[0]]) assertCondition(child);
  }

  function evaluateCondition(expression, context) {
    assertCondition(expression);
    if (typeof expression === 'string') return Boolean(definitions.get(expression)(context));
    if (expression.all) return expression.all.every(child => evaluateCondition(child, context));
    if (expression.any) return expression.any.some(child => evaluateCondition(child, context));
    return !evaluateCondition(expression.not, context);
  }

  if (includeDefaults) {
    for (const [id, predicate] of Object.entries(defaultConditions)) registerCondition(id, predicate);
  }

  return {
    registerCondition,
    evaluateCondition,
    assertCondition,
    has: id => definitions.has(id),
    ids: () => [...definitions.keys()],
  };
}

export const conditions = createConditionRegistry();
export const registerCondition = conditions.registerCondition;
export const evaluateCondition = conditions.evaluateCondition;
export const assertCondition = conditions.assertCondition;
