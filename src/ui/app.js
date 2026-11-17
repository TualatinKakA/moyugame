import { loadState, saveState, normalizeState, SAVE_KEY, SCHEMA2_BACKUP_KEY, touchState } from '../core/state.js';
import { emitGameEvent } from '../core/events.js';
import { createGameStory } from './story/bootstrap.js';
import { getHighestBusinessAchievement } from '../systems/achievements.js';
import { formatNumber, formatTime } from '../core/number.js';
import { BUILDINGS, BUILDING_BY_ID, availableBuildings } from '../content/r0r3/buildings.js';
import BUILDING_UPGRADES from '../content/r0r3/building-upgrades.js';
import { MISC_UPGRADES } from '../content/r0r3/misc-upgrades.js';
import { CHALLENGES } from '../content/r0r3/challenges.js';
import { SPELLS, SPELL_BY_ID } from '../content/r0r3/spells.js';
import {
  FACTION_BY_ID, UPGRADE_BY_ID, computeState, computeSnapshot, buildingQuote, buyBuilding, buyBuildingUpgrade, buyMiscUpgrade, requirementMet,
  buyFactionUpgrade, buyProof, spellAvailable, workClick, castSpell, tick, pendingGems,
  abdicate, reincarnate, reincarnationRequirement, buyRoyalExchange, unlockArchaeology,
  excavate, unlockNeutralFaction, unlockUnderworld, completePrestigeQuest, mercenaryTributeCost,
  payMercenaryTribute, mercenaryOath, joinMercenary, selectMercenarySpell, buyMercenaryUpgrade,
  applyOffline,
} from '../systems/engine.js';

const $ = id => document.getElementById(id);
const money = n => `¥ ${formatNumber(n)}`;
const factions = Object.values(FACTION_BY_ID);
let state = loadState();
const story = createGameStory({
  document,
  getState: () => state,
  computeSnapshot,
  save: persistStory,
  onRetire: completeRetirement,
});
const BASIC_FACTIONS = new Set(['fairy', 'elf', 'angel', 'goblin', 'undead', 'demon']);
let resetting = false;
let activeTab = 'work';
let panelDirty = true;
let lastPanelRender = 0;
let logs = ['打卡成功。系统提示：请勿寻找公司的出口。'];
let toastTimer;
const coinSoundPools = Array.from({ length: 8 }, (_, index) => {
  const pool = Array.from({ length: 3 }, () => {
    const audio = new Audio(`assets/audio/coin-${String(index + 1).padStart(2, '0')}.ogg`);
    audio.preload = 'auto';
    return audio;
  });
  pool.index = 0;
  return pool;
});
let lastCoinSound = 0;
function playCoinSound() {
  const now = performance.now();
  if (now - lastCoinSound < 65) return;
  lastCoinSound = now;
  const pool = coinSoundPools[Math.floor(Math.random() * coinSoundPools.length)];
  const audio = pool[pool.index++ % pool.length];
  audio.currentTime = 0;
  audio.volume = 0.13;
  audio.playbackRate = 0.94 + Math.random() * 0.24;
  audio.play().catch(() => {});
}
function workFeedback(event) {
  const amount = computeState(state).clickReward;
  workClick(state);
  emitGameEvent('work.clicked', { totalClicks: state.stats.total.clicks, success: true });
  playCoinSound();
  const zone = document.querySelector('#workArea .work-zone');
  if (!zone) return;
  const button = zone.querySelector('.work-btn');
  const rect = zone.getBoundingClientRect();
  const x = event?.clientX ? event.clientX - rect.left : rect.width / 2;
  const y = event?.clientY ? event.clientY - rect.top : Math.min(150, rect.height * 0.4);
  button.classList.remove('coin-hit');
  void button.offsetWidth;
  button.classList.add('coin-hit');
  setTimeout(() => button.classList.remove('coin-hit'), 180);
  const floater = document.createElement('span');
  floater.className = 'coin-float';
  floater.textContent = `+¥ ${formatNumber(amount)}`;
  floater.style.left = `${x}px`;
  floater.style.top = `${y}px`;
  zone.appendChild(floater);
  setTimeout(() => floater.remove(), 800);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const count = Math.min(10, 4 + Math.floor(Math.log10(amount + 1)));
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('img');
    particle.className = 'coin-particle';
    particle.src = `assets/images/${Math.random() > 0.25 ? 'coin' : 'cash'}.png`;
    particle.alt = '';
    particle.style.left = `${x + (Math.random() - 0.5) * 35}px`;
    particle.style.top = `${y + (Math.random() - 0.5) * 20}px`;
    particle.style.setProperty('--dx', `${(Math.random() - 0.5) * 150}px`);
    particle.style.setProperty('--dy', `${-60 - Math.random() * 90}px`);
    particle.style.setProperty('--spin', `${(Math.random() - 0.5) * 480}deg`);
    zone.appendChild(particle);
    setTimeout(() => particle.remove(), 750);
  }
}

function currentBusiness() {
  return getHighestBusinessAchievement(state, {
    registry: story.achievementRegistry,
    computeSnapshot,
  });
}
function notify(text, error = false) {
  logs.unshift(text); logs = logs.slice(0, 8);
  $('toast').textContent = text;
  $('toast').classList.toggle('error', error);
  $('toast').classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2600);
  renderSide();
}
function refresh(panel = false) {
  if (panel) panelDirty = true;
  const d = computeState(state);
  const manaMax = d.manaMax;
  const manaPercent = Math.max(0, Math.min(100, state.mana / manaMax * 100));
  $('coins').textContent = money(state.coins);
  $('production').textContent = money(d.production);
  $('gems').textContent = formatNumber(state.gems);
  $('mana').textContent = `${formatNumber(state.mana)} / ${formatNumber(manaMax)}`;
  $('manaRate').textContent = `+${formatNumber(d.manaRegen)} / 秒`;
  $('manaFill').style.width = `${manaPercent}%`;
  $('manaProgress').setAttribute('aria-valuemax', String(manaMax));
  $('manaProgress').setAttribute('aria-valuenow', String(state.mana));
  $('fcChance').textContent = `${formatNumber(d.fcChance)}%`;
  $('rankText').textContent = `R${state.progression.reincarnations} · ${currentBusiness().scope}`;
  renderSide();
  if (panelDirty) {
    renderWork();
    if (activeTab !== 'work') renderPanel();
    panelDirty = false;
  }
}
function renderSide() {
  const business = currentBusiness();
  $('chapterName').textContent = business.scope;
  $('chapterStory').textContent = `${business.rank} · 奖杯与档案持续记录。`;
  $('factionName').textContent = state.faction === 'mercenary' ? '外包联盟' : FACTION_BY_ID[state.faction]?.name || '尚未选择';
  $('factionDetail').textContent = state.prestige ? `叠加：${FACTION_BY_ID[state.prestige].name}` : state.alignment ? `立场：${{ good: '进取', evil: '强压', neutral: '均衡' }[state.alignment]}` : '先购买部门立场，再签署部门条约。';
  const stats = [
    ['本轮时间', formatTime(state.stats.run.time)], ['本轮点击', formatNumber(state.stats.run.clicks)],
    ['设施总数', formatNumber(Object.values(state.buildings).reduce((a, b) => a + b, 0))],
    ['数字员工', formatNumber(computeState(state).assistants)],
  ];
  $('quickStats').innerHTML = stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  $('eventLog').innerHTML = logs.map(x => `<li>${x}</li>`).join('');
}
function buyControls() {
  return `<div class="buy-controls">${[1, 10, 'max'].map(x => `<button data-action="buy-amount" data-value="${x}" class="${state.settings.buyAmount === x ? 'active' : ''}">${String(x).toUpperCase()}</button>`).join('')}</div>`;
}
function skillButtons() {
  const available = SPELLS.filter(s => spellAvailable(state, s.id));
  if (!available.length) return '<p class="notice">选择部门立场或签署条约后解锁技能。</p>';
  return `<div class="skill-bar">${available.map(s => `<button class="skill-btn ${state.activeSpells[s.id] > 0 ? 'active' : ''}" data-action="cast" data-id="${s.id}"><b>${s.name}</b><small>${s.description}</small><em>${state.activeSpells[s.id] > 0 ? `生效中 ${formatNumber(state.activeSpells[s.id])} 秒` : `${formatNumber(s.cost)} 精力`}</em></button>`).join('')}</div>`;
}
function workView() {
  const d = computeState(state);
  return `<div class="work-summary"><div><small>每次搬砖</small><strong>${money(d.clickReward)}</strong></div><div><small>数字员工</small><strong>${formatNumber(d.assistants)}</strong></div><div><small>本轮时间</small><strong>${formatTime(state.stats.run.time)}</strong></div></div>
    ${skillButtons()}
    <section class="work-zone">
      <div class="office-window"><div class="window-view"></div></div>
      <button class="work-btn" data-action="work" aria-label="点击显示器搬砖"><img class="monitor-img" src="assets/images/monitor.png" alt=""><span class="monitor-screen"><small>待办事项</small><strong>∞</strong><small>点击显示器搬砖</small></span><span class="work-label">点击 / SPACE 搬砖</span></button>
      <div class="desk-edge"></div><img class="keyboard-img" src="assets/images/keyboard.png" alt=""><img class="coffee-img" src="assets/images/coffee.png" alt="">
      <div class="work-caption">今日待办：∞　　距离下班：--:--　　当前职级：R${state.progression.reincarnations}</div>
    </section>`;
}
function buildingView() {
  const d = computeState(state);
  const buildings = availableBuildings(state);
  const cards = buildings.map(b => {
    const q = windowQuote(b.id);
    const count = state.buildings[b.id];
    const output = d.outputs[b.id] || 0;
    return `<article class="card building-card"><span class="badge">T${b.tier}</span><h3>${b.name} × ${formatNumber(count)}</h3><span class="building-output">产出 ${money(output)} / 秒</span><span class="meta">${money(q.cost)} · ${q.qty} 个</span><button data-action="buy-building" data-id="${b.id}" ${!q.qty || state.coins < q.cost ? 'disabled' : ''}>采购</button></article>`;
  }).join('');
  const availableUpgrades = BUILDING_UPGRADES.filter(u => state.buildings[u.building] >= u.requirement || state.upgrades.includes(u.id));
  const upgrades = availableUpgrades.map(u => {
    const b = BUILDING_BY_ID[u.building]; const owned = state.upgrades.includes(u.id);
    return `<article class="card ${owned ? 'owned' : ''}"><span class="badge">T${b.tier} · ${u.upgradeLevel}</span><h3>${b.name} · 流程改善 ${u.upgradeLevel}</h3><div class="source-name">${u.sourceName}</div><p>该类设施产出 +${formatNumber(u.bonusPercent)}%${u.assistants ? '，数字员工 +1' : ''}${u.globalPercentPerTrophy ? `，每成就使其他设施 +${u.globalPercentPerTrophy}%` : ''}</p><div class="meta">要求 ${u.requirement} 个 · ${money(u.cost)}</div><button data-action="buy-building-upgrade" data-id="${u.id}" ${owned || state.coins < u.cost ? 'disabled' : ''}>${owned ? '已生效' : '购买升级'}</button></article>`;
  }).join('');
  const misc = MISC_UPGRADES.filter(u => state.upgrades.includes(u.id) || requirementMet(state, u.req));
  const miscCards = misc.map(u => `<article class="card ${state.upgrades.includes(u.id) ? 'owned' : ''}"><h3>${u.name}</h3><div class="source-name">${u.id}</div><p>${u.effect}</p><div class="meta">${money(u.cost)}</div><button data-action="buy-misc-upgrade" data-id="${u.id}" ${state.upgrades.includes(u.id) || state.coins < u.cost ? 'disabled' : ''}>${state.upgrades.includes(u.id) ? '已生效' : '购买通用升级'}</button></article>`).join('');
  return `<div class="panel-head"><div><h2>设施采购</h2><p>价格按几何级数增长，升级不改变核心公式。</p></div>${buyControls()}</div><div class="card-grid building-grid">${cards}</div><section class="subsection"><h3>设施升级 · 已满足条件或已购买</h3><div class="card-grid">${upgrades || '<p class="notice">增加设施数量后显示对应升级。</p>'}</div></section><section class="subsection"><h3>通用升级 · 已满足条件或已购买</h3><div class="card-grid">${miscCards || '<p class="notice">继续点击和积累产值以解锁通用升级。</p>'}</div></section>`;
}
function windowQuote(id) {
  return buildingQuote(state, id, state.settings.buyAmount, computeState(state).mods);
}

function currencyList() {
  return `<div class="currency-list">${Object.entries(state.factionCoins).filter(([, v]) => v > 0).map(([id, v]) => `<span>${FACTION_BY_ID[id]?.name || id} ${formatNumber(v)}</span>`).join('') || '<span>尚未发现部门影响力</span>'}</div>`;
}
function upgradeCard(u) {
  const owned = state.upgrades.includes(u.id) || state.mercenary.upgrades.includes(u.id);
  const formula = u.formulas?.join('<br>') || '';
  return `<article class="card ${owned ? 'owned' : ''}"><span class="badge">${u.code} · T${u.tier}</span><h3>${FACTION_BY_ID[u.faction].name} · ${u.code}</h3><div class="source-name">${u.sourceName}</div><p>${u.effects.join('；')}</p>${formula ? `<div class="meta">${formula}</div>` : ''}<div class="meta">${u.costText}</div>${state.faction === 'mercenary' ? `<button data-action="merc-upgrade" data-id="${u.id}" ${owned ? 'disabled' : ''}>${owned ? '已选入' : '选入混编构筑'}</button>` : `<button data-action="buy-faction-upgrade" data-id="${u.id}" ${owned ? 'disabled' : ''}>${owned ? '已生效' : '购买升级'}</button>`}</article>`;
}
function proofUnavailable(alignment) {
  const neutralLocked = alignment === 'neutral' && !state.artifacts.some(a => ['titanUnlock', 'druidUnlock', 'facelessUnlock'].includes(a));
  const cost = alignment === 'neutral' ? 1e16 : 25000;
  return Boolean(state.faction || state.prestige) || neutralLocked || state.coins < cost;
}
function factionView() {
  const current = FACTION_BY_ID[state.faction];
  const prestige = FACTION_BY_ID[state.prestige];
  let upgrades = [];
  if (state.faction === 'mercenary') upgrades = factions.flatMap(f => f.upgrades.filter(u => u.kind !== 'heritage'));
  else upgrades = [...(current?.upgrades || []), ...(prestige?.upgrades || [])];
  return `<div class="panel-head"><div><h2>部门与立场</h2><p>部门硬币、专属技能和分层升级均使用独立配置。</p></div></div>
    <div class="action-row">${['good', 'evil', 'neutral'].map(a => `<button data-action="proof" data-id="${a}" class="${state.alignment === a ? 'active' : ''}" ${proofUnavailable(a) ? 'disabled' : ''}>${{ good: '进取证明 ¥25K', evil: '强压证明 ¥25K', neutral: '均衡证明 ¥10Qa' }[a]}</button>`).join('')}</div>
    ${currencyList()}
    <div class="card-grid">${factions.map(f => {
      const treaty = f.upgrades[0];
      const active = state.faction === f.id || state.prestige === f.id;
      return `<article class="card ${active ? 'owned' : ''}"><span class="badge">${{ good: '进取', evil: '强压', neutral: '均衡' }[f.alignment]}</span><h3>${f.name}</h3><div class="source-name">${f.sourceName}</div><p>专属技能：${f.spellName}。派系硬币、升级与手册分层开放。</p><div class="meta">${treaty.costText}</div><button data-action="buy-faction-upgrade" data-id="${treaty.id}" ${active ? 'disabled' : ''}>${active ? '当前已加入' : '签署部门条约'}</button></article>`;
    }).join('')}</div>
    <section class="subsection"><h3>当前部门升级</h3><div class="card-grid">${upgrades.map(upgradeCard).join('') || '<p class="notice">请先签署一个部门条约。</p>'}</div></section>
    ${state.faction === 'mercenary' ? `<section class="subsection"><h3>佣兵技能混编 · 最多 2 个</h3><div class="card-grid">${SPELLS.filter(s => s.faction).map(s => `<article class="card"><h3>${s.name}</h3><p>${s.description}</p><button data-action="merc-spell" data-id="${s.id}" ${state.mercenary.spells.includes(s.id) ? 'disabled' : ''}>${state.mercenary.spells.includes(s.id) ? '已选择' : '选择技能'}</button></article>`).join('')}</div></section>` : ''}
    ${current ? `<section class="subsection"><h3>部门挑战 · R2 开放</h3><div class="card-grid">${CHALLENGES.filter(c => c.faction === current.id).map(c => `<article class="card ${state.challenges.includes(c.id) ? 'owned' : ''}"><span class="badge">${state.challenges.includes(c.id) ? '已完成' : '待完成'}</span><h3>${c.name}</h3><div class="source-name">${c.sourceName}</div><p>${c.description}</p><div class="meta">奖励：${c.reward}</div></article>`).join('')}</div></section>` : ''}
    ${current ? `<section class="subsection"><h3>资源置换</h3><p>每次置换提高该部门置换计数，并提供基础 10% 全局产出加成。</p><button data-action="exchange" data-id="${current.id}">${current.name}置换 · ${money(100 * 1.1 ** (state.stats.total.exchangesByFaction?.[current.id] || 0))}</button></section>` : ''}`;
}
function auditView() {
  const tribute = mercenaryTributeCost(state);
  return `<div class="panel-head"><div><h2>档案审计</h2><p>检索旧合同、被删除的部门与跨时间线遗物。</p></div></div>
    <div class="card-grid">
      <article class="card"><h3>考古与档案权限</h3><p>要求：超过 1B 期权、历史产值 10Oc，并支付 ¥100Oc。</p><button data-action="unlock-archaeology" ${state.unlocked.archaeology ? 'disabled' : ''}>${state.unlocked.archaeology ? '已永久解锁' : '解锁档案审计'}</button></article>
      <article class="card"><h3>执行审计</h3><p>本次职业第 ${state.excavationCount} 次 · 下一次成本按 1.2 倍增长 · 35% 概率发现影响力。</p><button data-action="excavate" ${!state.unlocked.archaeology ? 'disabled' : ''}>审计旧档案</button></article>
      ${['titan', 'druid', 'faceless'].map(id => `<article class="card"><h3>${FACTION_BY_ID[id].name}解锁</h3><p>${id === 'titan' ? '两份石板线索，并持有 300 传奇工位。' : id === 'druid' ? '两份树皮线索，并累计发现 1M 影响力。' : '两份骨片线索，并累计游戏 36 小时。'}</p><button data-action="unlock-neutral" data-id="${id}" ${state.artifacts.includes(`${id}Unlock`) ? 'disabled' : ''}>${state.artifacts.includes(`${id}Unlock`) ? '已解锁' : '修复部门遗物 · ¥1No'}</button></article>`).join('')}
      <article class="card"><h3>地下组织通行证</h3><p>要求本次职业 200 次审计，支付 ¥50Qid，永久开放高级部门任务。</p><button data-action="unlock-underworld" ${state.unlocked.underworld ? 'disabled' : ''}>${state.unlocked.underworld ? '已解锁' : '购买通行证'}</button></article>
      ${['dwarf', 'drow'].map(id => `<article class="card"><h3>${FACTION_BY_ID[id].name}任务</h3><p>${id === 'dwarf' ? '进取立场、800 茶水间、7K 设施、本轮 10K 点击。' : '强压立场、650 黑盒运维中心、325 成就、历史 10K 次施法。'}</p><button data-action="prestige-quest" data-id="${id}" ${state.artifacts.includes(`${id}Quest`) ? 'disabled' : ''}>${state.artifacts.includes(`${id}Quest`) ? '已完成' : '完成高级部门任务'}</button></article>`).join('')}
      <article class="card"><h3>R3 · 佣兵贡金</h3><p>价格随本轮时间增加：${money(tribute.coins)}，另需每种部门影响力 ${formatNumber(tribute.factionCoins)}。</p><button data-action="merc-tribute" ${state.unlocked.mercenaryTribute ? 'disabled' : ''}>${state.unlocked.mercenaryTribute ? '贡金已支付' : '支付佣兵贡金'}</button></article>
      <article class="card"><h3>佣兵誓约</h3><p>支付 ¥1Tvg，永久解锁混编部门。</p><button data-action="merc-oath" ${state.unlocked.mercenary ? 'disabled' : ''}>${state.unlocked.mercenary ? '已永久解锁' : '签署佣兵誓约'}</button></article>
    </div>
    ${state.unlocked.mercenary ? `<section class="subsection"><h3>加入外包联盟</h3><div class="action-row">${['good', 'evil', 'neutral'].map(a => `<button data-action="join-merc" data-id="${a}">${{ good: '进取混编', evil: '强压混编', neutral: '均衡混编' }[a]}</button>`).join('')}</div></section>` : ''}
    <section class="subsection"><h3>已发现遗物与档案</h3><div class="currency-list">${state.artifacts.map(x => `<span>${x}</span>`).join('') || '<span>尚无记录</span>'}</div></section>`;
}
function statRows(scope, title) {
  const s = state.stats[scope];
  return `<h3>${title}</h3><table class="stat-table">${[['时间', formatTime(s.time)], ['账面产值', money(s.coins)], ['点击次数', formatNumber(s.clicks)], ['点击收入', money(s.clickCoins)], ['施法次数', formatNumber(s.spellsCast)], ['发现影响力', formatNumber(s.factionCoins)], ['审计次数', formatNumber(s.excavations)], ['资源置换', formatNumber(s.exchanges || 0)]].map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;
}
function moreView() {
  const req = reincarnationRequirement(state.progression.reincarnations);
  return `<div class="panel-head"><div><h2>职业与存档</h2><p>重置、统计和数据管理。</p></div></div>
    <div class="card-grid">
      <article class="card"><h3>申请离职</h3><p>本轮产值 ${money(state.stats.run.coins)} · 本次新增期权 ${formatNumber(pendingGems(state))}。清空本轮工资、设施、升级和部门，保留永久内容。</p><button data-action="abdicate">离职并结算期权</button></article>
      <article class="card"><h3>转行进入 R${state.progression.reincarnations + 1}</h3><p>需要持有 ${formatNumber(req)} 期权，当前 ${formatNumber(state.gems)}。重置深度高于离职。</p><button data-action="reincarnate" ${state.gems < req ? 'disabled' : ''}>转行</button></article>
    </div>
    <section class="subsection"><h3>数据管理</h3><div class="action-row"><button data-action="save">立即保存</button><button data-action="export">导出存档</button><button data-action="import">导入存档</button><button class="danger" data-action="hard-reset">清除全部进度</button></div><textarea id="exportText" placeholder="点击导出存档后，此处显示 JSON 存档。"></textarea></section>
    <section class="subsection" id="achievementMount"></section>
    <section class="subsection" id="storyArchiveMount"></section>
    <section class="subsection">${statRows('run', '本轮统计')}${statRows('r', '本次职业统计')}${state.progression.ascension > 0 ? statRows('ascension', '本次升阶统计') : ''}${statRows('total', '全部历史统计')}</section>`;
}
function statsView() {
  return `<div class="panel-head"><div><h2>职业统计</h2><p>分别查看本轮、本次职业与全部历史数据。</p></div></div>
    <section class="subsection">${statRows('run', '本轮统计')}${statRows('r', '本次职业统计')}${state.progression.ascension > 0 ? statRows('ascension', '本次升阶统计') : ''}${statRows('total', '全部历史统计')}</section>`;
}
function renderWork() {
  $('workArea').innerHTML = workView();
  $('workArea').appendChild(story.ui.retirementElement);
  lastPanelRender = performance.now();
  if (activeTab === 'work') panelDirty = false;
}
function renderPanel(force = false) {
  const now = performance.now();
  if (activeTab === 'work') {
    $('mainPanel').hidden = true;
    panelDirty = false;
    return;
  }
  if (!force && !panelDirty && now - lastPanelRender < 500) return;
  const content = activeTab === 'buildings' ? buildingView() : activeTab === 'factions' ? factionView() : activeTab === 'audit' ? auditView() : activeTab === 'stats' ? statsView() : moreView();
  $('mainPanel').innerHTML = `<div class="panel-return"><button data-action="close-panel" aria-label="返回工位">× 返回工位</button></div>${content}`;
  if (activeTab === 'more') {
    $('achievementMount').appendChild(story.ui.achievementElement);
    $('storyArchiveMount').appendChild(story.ui.archiveElement);
  }
  $('mainPanel').hidden = false;
  panelDirty = false; lastPanelRender = now;
}
function closeAuxPanel() {
  activeTab = 'work';
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
  $('mainPanel').hidden = true;
  panelDirty = false;
}

function actionResult(result, success, failure = '当前条件或资源不足') {
  if (result) { notify(success); panelDirty = true; }
  else notify(failure, true);
  return result;
}
function persistStory(current) {
  touchState(current);
  saveState(current);
}
function completeRetirement() {
  const snapshot = computeSnapshot(state);
  if (!snapshot.retirement.eligible) return { ok: false, reason: 'target-not-met' };
  const earned = pendingGems(state);
  if (!confirm(`本次退休将获得 ${formatNumber(earned)} 期权。\n本轮工资、设施与升级将清零，当前部门关系将结束。\n奖杯、永久解锁、初始剧情、业务域与职阶将保留。确定结算吗？`)) {
    return { ok: false, reason: 'cancelled' };
  }
  const previousAbdications = state.stats.total.abdications || 0;
  const runCoins = state.stats.run.coins;
  const next = abdicate(state);
  if (!next) return { ok: false, reason: 'target-not-met' };
  state = next;
  saveState(state);
  notify('退休结算完成。新的职业周期已经开启');
  emitGameEvent('abdication.completed', {
    saved: true,
    targetMet: true,
    firstRetirement: previousAbdications === 0,
    previousAbdications,
    runCoins,
  });
  return { ok: true };
}
document.addEventListener('click', event => {
  const tab = event.target.closest('[data-tab]');
  if (tab) {
    if (activeTab === tab.dataset.tab) { closeAuxPanel(); return; }
    activeTab = tab.dataset.tab;
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b === tab));
    panelDirty = true; renderPanel(true); return;
  }
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (action === 'close-panel') { closeAuxPanel(); return; }
  if (action === 'start') {
    const isNewSave = !state.story.triggered['intro.onboarding']
      && state.stats.total.time === 0 && state.stats.total.clicks === 0;
    $('intro').classList.add('hidden');
    notify('已入职。先点击显示器，或积累 ¥25K 购买部门立场。');
    emitGameEvent('game.started', { isNewSave });
  }
  if (action === 'work') workFeedback(event);
  if (action === 'buy-amount') { state.settings.buyAmount = button.dataset.value === 'max' ? 'max' : Number(button.dataset.value); panelDirty = true; }
  if (action === 'buy-building') {
    const before = state.buildings[id] || 0;
    const purchased = actionResult(buyBuilding(state, id), '设施采购完成');
    if (purchased) emitGameEvent('building.purchased', {
      buildingId: id, quantity: state.buildings[id] - before, totalOwned: state.buildings[id],
    });
  }
  if (action === 'buy-building-upgrade') {
    if (actionResult(buyBuildingUpgrade(state, id), '设施升级已生效')) {
      emitGameEvent('building.upgraded', { buildingId: UPGRADE_BY_ID[id]?.building, upgradeId: id });
    }
  }
  if (action === 'buy-misc-upgrade') actionResult(buyMiscUpgrade(state, id), '通用升级已生效');
  if (action === 'buy-faction-upgrade') {
    const previousFaction = state.faction;
    const purchased = actionResult(buyFactionUpgrade(state, id), '部门升级已生效');
    if (purchased && state.faction !== previousFaction) {
      emitGameEvent('faction.joined', { factionId: state.faction, basic: BASIC_FACTIONS.has(state.faction) });
    }
  }
  if (action === 'proof') actionResult(buyProof(state, id), '部门立场已确认');
  if (action === 'cast') {
    if (actionResult(castSpell(state, id), `已释放：${SPELL_BY_ID[id].name}`, '精力不足或技能尚未解锁')) {
      emitGameEvent('spell.cast', { spellId: id });
    }
  }
  if (action === 'exchange') actionResult(buyRoyalExchange(state, id, 1) > 0, '资源置换完成');
  if (action === 'unlock-archaeology') actionResult(unlockArchaeology(state), '档案审计已永久解锁');
  if (action === 'excavate') {
    const before = state.artifacts.length;
    if (actionResult(excavate(state), '审计完成') && state.artifacts.length > before) {
      emitGameEvent('artifact.found', { artifactIds: state.artifacts.slice(before) });
    }
  }
  if (action === 'unlock-neutral') actionResult(unlockNeutralFaction(state, id), '中立部门已解锁');
  if (action === 'unlock-underworld') actionResult(unlockUnderworld(state), '高级部门任务已解锁');
  if (action === 'prestige-quest') actionResult(completePrestigeQuest(state, id), '高级部门任务已完成');
  if (action === 'merc-tribute') actionResult(payMercenaryTribute(state), '佣兵贡金已支付');
  if (action === 'merc-oath') actionResult(mercenaryOath(state), '外包联盟已永久解锁');
  if (action === 'join-merc') actionResult(joinMercenary(state, id), '已加入外包联盟，请选择技能与升级');
  if (action === 'merc-spell') actionResult(selectMercenarySpell(state, id), '技能已加入混编构筑');
  if (action === 'merc-upgrade') actionResult(buyMercenaryUpgrade(state, id), '升级已加入混编构筑');
  if (action === 'save') { saveState(state); $('saveStatus').textContent = '已保存'; notify('存档已写入本地'); }
  if (action === 'export') { saveState(state); $('exportText').value = localStorage.getItem(SAVE_KEY); $('exportText').select(); notify('存档已导出，请复制保存'); }
  if (action === 'import') $('importFile').click();
  if (action === 'abdicate') story.ui.requestRetirement();
  if (action === 'reincarnate') {
    if (!confirm(`确定转行进入 R${state.progression.reincarnations + 1} 吗？当前期权将被清空。`)) return;
    const previousReincarnations = state.progression.reincarnations;
    const next = reincarnate(state);
    if (next) {
      state = next;
      notify(`已进入 R${state.progression.reincarnations}。新的组织规则已生效`);
      saveState(state);
      emitGameEvent('reincarnation.completed', {
        reincarnations: state.progression.reincarnations,
        previousReincarnations,
      });
    } else notify('期权不足，无法转行', true);
  }
  if (action === 'hard-reset') {
    if (!confirm('确定删除全部本地进度吗？此操作不能撤销。')) return;
    resetting = true;
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(SCHEMA2_BACKUP_KEY);
    location.reload();
    return;
  }
  refresh(action === 'work' ? false : true);
});
$('importFile').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed.contentVersion || !parsed.stats) throw new Error('invalid');
    state = normalizeState(parsed);
    saveState(state); story.ui.sync(); panelDirty = true; notify('存档导入成功'); refresh(true);
  } catch { notify('导入失败：文件不是有效的游戏存档', true); }
  event.target.value = '';
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && activeTab !== 'work') closeAuxPanel();
  if (event.code === 'Space' && activeTab === 'work' && $('intro').classList.contains('hidden') && !['INPUT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement.tagName)) {
    event.preventDefault(); workFeedback(); refresh();
  }
});
window.addEventListener('beforeunload', () => { if (!resetting) saveState(state); });
document.addEventListener('visibilitychange', () => { if (document.hidden && !resetting) saveState(state); });

const away = Math.max(0, (Date.now() - state.lastSave) / 1000);
if (away > 10 && computeState(state).production > 0) {
  const earned = applyOffline(state, away);
  if (earned > 0) {
    logs.unshift(`离线 ${formatTime(away)}，结算 ${money(earned)}。`);
    emitGameEvent('offline.settled', { seconds: away, coins: earned });
  }
}
if (state.stats.total.time > 0 || state.stats.total.clicks > 0 || state.story.triggered['intro.onboarding']) {
  $('intro').classList.add('hidden');
}
refresh(true);
let lastTick = performance.now();
setInterval(() => {
  const now = performance.now();
  const previousChallenges = new Set(state.challenges);
  tick(state, (now - lastTick) / 1000); lastTick = now;
  for (const challengeId of state.challenges) {
    if (!previousChallenges.has(challengeId)) emitGameEvent('challenge.completed', { challengeId });
  }
  story.ui.handleTick(now);
  if (activeTab === 'work' && now - lastPanelRender > 1000) panelDirty = true;
  refresh();
}, 200);
setInterval(() => { if (!resetting) { saveState(state); $('saveStatus').textContent = '已自动保存'; } }, 15000);
