import {
  getAchievementState, getAchievementCost, resolveAchievementReward, getHighestBusinessAchievement,
} from '../../systems/achievements.js';
import { resolveSnapshot } from '../../systems/conditions.js';
import { ensureStoryStyles } from './story-modal.js';

const PAGE_SIZE = 20;
const STATUS_LABELS = { locked: '未达成', available: '可领取', purchased: '已领取', active: '已生效' };
const CATEGORY_LABELS = {
  all: '全部分类', story: '剧情', gameplay: '游玩', challenge: '挑战',
  secret: '秘密', event: '活动', collection: '收藏',
};

function node(document, tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function rewardText(reward) {
  if (!reward || reward.type === 'none') return '无直接数值奖励';
  if (reward.ascensionNerf) return `奖励类型：${reward.type}；升阶修正由数值系统按 ${reward.ascensionNerf.rule} 规则计算`;
  const value = typeof reward.value === 'object' ? '' : ` ${reward.operation || ''} ${reward.value ?? ''}`.trim();
  return `奖励类型：${reward.type}${value ? `；${value}` : ''}，由数值系统统一计算`;
}

export function createAchievementPanel({
  document,
  getState,
  registry,
  computeSnapshot,
  onPurchase = () => {},
  onReplay = () => {},
  onRead = () => {},
}) {
  ensureStoryStyles(document);
  let category = 'all';
  let status = 'all';
  let page = 0;
  let selected = null;
  let message = '';

  const root = node(document, 'section', 'achievement-panel');
  root.setAttribute('aria-label', '奖杯与成就');
  root.appendChild(node(document, 'h2', 'story-section-title', '奖杯与成就'));
  const business = node(document, 'p', 'achievement-business');
  const controls = node(document, 'div', 'achievement-controls');
  const categorySelect = node(document, 'select', 'achievement-filter');
  categorySelect.setAttribute('aria-label', '按分类筛选成就');
  for (const [value, label] of Object.entries(CATEGORY_LABELS)) {
    const option = node(document, 'option', '', label);
    option.value = value;
    categorySelect.appendChild(option);
  }
  const statusSelect = node(document, 'select', 'achievement-filter');
  statusSelect.setAttribute('aria-label', '按状态筛选成就');
  for (const [value, label] of Object.entries({ all: '全部状态', ...STATUS_LABELS })) {
    const option = node(document, 'option', '', label);
    option.value = value;
    statusSelect.appendChild(option);
  }
  categorySelect.addEventListener('change', () => { category = categorySelect.value; page = 0; render(); });
  statusSelect.addEventListener('change', () => { status = statusSelect.value; page = 0; render(); });
  controls.append(categorySelect, statusSelect);
  const summary = node(document, 'p', 'achievement-summary');
  const feedback = node(document, 'p', 'achievement-feedback');
  feedback.setAttribute('role', 'status');
  const list = node(document, 'div', 'achievement-list');
  const more = node(document, 'button', 'story-button story-button-secondary', '显示更多');
  more.type = 'button';
  more.addEventListener('click', () => { page += 1; render(); });
  root.append(business, controls, summary, feedback, list, more);

  function purchase(id) {
    try {
      const result = onPurchase(id);
      message = result?.ok === false ? `暂不能领取：${result.reason || '条件未满足'}` : '奖杯奖励已生效。';
      selected = id;
      onRead(id);
    } catch (error) {
      message = `领取失败：${error.message}`;
    }
    render();
  }

  function detail(definition, entry, snapshot) {
    const container = node(document, 'div', 'achievement-detail');
    container.appendChild(node(document, 'p', 'achievement-description', definition.description));
    container.appendChild(node(document, 'p', 'achievement-status', `状态：${STATUS_LABELS[entry.status]}`));
    if (definition.business) {
      container.appendChild(node(document, 'p', 'achievement-business-reward', `业务域：${definition.business.scope}；职阶：${definition.business.rank}`));
    }
    const reward = resolveAchievementReward(definition, snapshot);
    container.appendChild(node(document, 'p', 'achievement-reward', rewardText(reward)));
    if (definition.acquireMode === 'purchase' && entry.status === 'available') {
      const cost = getAchievementCost(definition, snapshot);
      const button = node(document, 'button', 'story-button story-button-primary', cost === 0 ? '免费领取' : `购买（${cost} ${definition.costCurrency || 'coins'}）`);
      button.type = 'button';
      button.addEventListener('click', () => purchase(definition.id));
      container.appendChild(button);
    }
    if (definition.storyId && (entry.status === 'active' || getState().story?.read?.includes(definition.storyId))) {
      const replay = node(document, 'button', 'story-button story-button-secondary', '回看关联剧情');
      replay.type = 'button';
      replay.addEventListener('click', () => onReplay(definition.storyId));
      container.appendChild(replay);
    }
    return container;
  }

  function render() {
    const state = getState();
    const snapshot = resolveSnapshot(state, computeSnapshot);
    const currentBusiness = getHighestBusinessAchievement(state, { registry, snapshot });
    business.textContent = `当前业务域：${currentBusiness.scope} · 职阶：${currentBusiness.rank}`;
    feedback.textContent = message;

    const entries = registry.definitions.map(definition => ({
      definition,
      entry: getAchievementState(state, definition, { registry, snapshot }),
    })).filter(({ definition, entry }) => {
      if (definition.visibility === 'hidden' && entry.status === 'locked') return false;
      return (category === 'all' || definition.category === category)
        && (status === 'all' || entry.status === status);
    });
    const visible = entries.slice(0, (page + 1) * PAGE_SIZE);
    summary.textContent = `已显示 ${visible.length} / ${entries.length} 条；已生效 ${registry.definitions.filter(definition => getAchievementState(state, definition, { registry, snapshot }).status === 'active').length} 条`;
    list.replaceChildren();

    for (const { definition, entry } of visible) {
      const concealed = definition.visibility !== 'visible' && entry.status === 'locked';
      const item = node(document, 'article', `achievement-item achievement-${entry.status}`);
      item.dataset.achievementId = definition.id;
      const button = node(document, 'button', 'achievement-summary-button');
      button.type = 'button';
      button.setAttribute('aria-expanded', selected === definition.id ? 'true' : 'false');
      button.append(
        node(document, 'span', 'achievement-category', CATEGORY_LABELS[definition.category]),
        node(document, 'strong', 'achievement-name', concealed ? '未解密的记录' : definition.name),
        node(document, 'span', 'achievement-state', STATUS_LABELS[entry.status]),
      );
      button.addEventListener('click', () => {
        selected = selected === definition.id ? null : definition.id;
        if (selected) onRead(definition.id);
        render();
      });
      item.appendChild(button);
      if (selected === definition.id && !concealed) item.appendChild(detail(definition, entry, snapshot));
      list.appendChild(item);
    }
    more.hidden = visible.length >= entries.length;
  }

  render();
  return Object.freeze({ element: root, render });
}
