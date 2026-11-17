import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createStoryModal, createStoryArchive } from '../src/ui/story/story-modal.js';
import { createAchievementPanel } from '../src/ui/story/achievement-panel.js';
import { createStoryUI } from '../src/ui/story/index.js';
import { purchaseAchievement } from '../src/systems/achievements.js';
import { STORIES } from '../src/content/story/index.js';
import { testContext, domainEvent } from './story-test-helpers.js';

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.parentNode = null;
    this.dataset = {};
    this.attributes = {};
    this.style = {};
    this.className = '';
    this._textContent = '';
    this.listeners = new Map();
    this.hidden = false;
    this.disabled = false;
    this.value = '';
  }

  set textContent(value) {
    this._textContent = String(value);
    for (const child of this.children) child.parentNode = null;
    this.children = [];
  }

  get textContent() {
    return this._textContent + this.children.map(child => child.textContent).join('');
  }

  appendChild(child) {
    child.parentNode?.children?.splice(child.parentNode.children.indexOf(child), 1);
    child.parentNode = this;
    this.children.push(child);
    if (this.tagName === 'SELECT' && child.tagName === 'OPTION' && !this.value) this.value = child.value;
    return child;
  }

  append(...children) {
    for (const child of children) this.appendChild(child);
  }

  replaceChildren(...children) {
    for (const child of this.children) child.parentNode = null;
    this.children = [];
    this.append(...children);
  }

  remove() {
    if (!this.parentNode) return;
    const index = this.parentNode.children.indexOf(this);
    if (index >= 0) this.parentNode.children.splice(index, 1);
    this.parentNode = null;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) || []).filter(item => item !== listener));
  }

  emit(type, init = {}) {
    const event = {
      type, target: this, key: init.key, shiftKey: Boolean(init.shiftKey),
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
    };
    for (const listener of [...(this.listeners.get(type) || [])]) listener(event);
    return event;
  }

  click() {
    return this.emit('click');
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  matches(selector) {
    const base = selector.trim().replace(/:not\([^)]*\)/g, '');
    if (!base) return false;
    if (base.startsWith('.')) return this.className.split(/\s+/).includes(base.slice(1));
    if (base.startsWith('#')) return this.id === base.slice(1);
    if (base.startsWith('[href]')) return Boolean(this.href);
    const attribute = base.match(/\[data-([a-z0-9-]+)\]/i);
    if (attribute) {
      const key = attribute[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      const tag = base.slice(0, attribute.index);
      return (!tag || this.tagName === tag.toUpperCase()) && this.dataset[key] !== undefined;
    }
    if (base.startsWith('[')) return this.attributes[base.slice(1, -1)] !== undefined;
    return this.tagName === base.toUpperCase();
  }

  querySelectorAll(selector) {
    const selectors = selector.split(',').map(item => item.trim());
    const result = [];
    const visit = node => {
      for (const child of node.children) {
        if (selectors.some(item => child.matches(item))) result.push(child);
        visit(child);
      }
    };
    visit(this);
    return result;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

class FakeDocument {
  constructor() {
    this.listeners = new Map();
    this.root = new FakeElement('html', this);
    this.head = new FakeElement('head', this);
    this.body = new FakeElement('body', this);
    this.root.append(this.head, this.body);
    this.activeElement = this.body;
    this.viewport = { width: 1280, height: 720 };
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  querySelector(selector) {
    return this.root.querySelector(selector);
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) || []).filter(item => item !== listener));
  }

  emit(type, init = {}) {
    const event = {
      type, key: init.key, shiftKey: Boolean(init.shiftKey), defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
    };
    for (const listener of [...(this.listeners.get(type) || [])]) listener(event);
    return event;
  }
}

function story(id = 'intro.onboarding') {
  return STORIES.find(item => item.id === id);
}

test('image failure preserves text and achievement, and Escape restores focus and scrolling', () => {
  const document = new FakeDocument();
  const previous = document.createElement('button');
  document.body.appendChild(previous);
  previous.focus();
  let closed;
  const modal = createStoryModal({ document, onClose: result => { closed = result; } });
  const achievement = { name: '第一天', description: '奖杯正文' };
  modal.show({ story: story(), achievement });
  assert.equal(document.body.style.overflow, 'hidden');
  assert.ok(document.body.textContent.includes('今天是你入职的第一天。'));
  assert.ok(document.body.textContent.includes('奖杯正文'));
  const image = document.body.querySelector('img');
  const fallback = document.body.querySelector('.story-image-fallback');
  image.emit('error');
  assert.equal(image.hidden, true);
  assert.equal(fallback.hidden, false);
  assert.ok(document.body.textContent.includes(story().imageAlt));
  const event = document.emit('keydown', { key: 'Escape' });
  assert.equal(event.defaultPrevented, true);
  assert.equal(closed.id, 'intro.onboarding');
  assert.equal(closed.replay, false);
  assert.equal(document.body.style.overflow, '');
  assert.equal(document.activeElement, previous);
  assert.equal(document.body.querySelector('.story-overlay'), null);
});

test('mobile close and skip remain explicit touch buttons with focus trapping', async () => {
  const document = new FakeDocument();
  document.viewport = { width: 375, height: 667 };
  const results = [];
  const modal = createStoryModal({ document, onClose: result => results.push(result) });
  modal.show({ story: story('intro.first_wage') });
  const panel = document.body.querySelector('.story-modal');
  const close = panel.querySelectorAll('button').find(button => button.dataset.action === 'close-story');
  const skip = panel.querySelectorAll('button').find(button => button.dataset.action === 'skip-story');
  assert.equal(document.activeElement, close);
  document.emit('keydown', { key: 'Tab' });
  assert.equal(document.activeElement, skip);
  skip.click();
  assert.equal(results[0].action, 'skip');
  modal.show({ story: story('intro.first_wage') });
  document.body.querySelector('[data-action="close-story"]');
  const closeButton = document.body.querySelectorAll('button').find(button => button.dataset.action === 'close-story');
  closeButton.click();
  assert.equal(results[1].action, 'close');
  const css = await readFile(new URL('../src/ui/story/story.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('archive replays stable story IDs', () => {
  const document = new FakeDocument();
  let replayed;
  const archive = createStoryArchive({ document, onReplay: id => { replayed = id; } });
  archive.render([{ id: 'intro.onboarding', at: 100, story: story() }]);
  archive.element.querySelector('button').click();
  assert.equal(replayed, 'intro.onboarding');
});

test('achievement panel purchases through the state machine and renders the active result', () => {
  const document = new FakeDocument();
  const context = testContext();
  context.state.coins = 1e27;
  context.state.achievements.stateById.rewind = { status: 'available', scope: 'profile', cycleKey: 'profile' };
  const panel = createAchievementPanel({
    document,
    getState: () => context.state,
    registry: context.achievementRegistry,
    onPurchase: id => purchaseAchievement(context.state, id, { registry: context.achievementRegistry }),
  });
  const item = panel.element.querySelector('[data-achievement-id]');
  const rewind = panel.element.querySelectorAll('article').find(article => article.dataset.achievementId === 'rewind');
  assert.ok(item);
  rewind.querySelector('button').click();
  const expanded = panel.element.querySelectorAll('article').find(article => article.dataset.achievementId === 'rewind');
  const buy = expanded.querySelectorAll('button').find(button => button.textContent.startsWith('购买'));
  assert.ok(buy);
  buy.click();
  assert.equal(context.state.achievements.stateById.rewind.status, 'active');
  assert.equal(context.state.coins, 0);
  assert.ok(panel.element.textContent.includes('已生效'));
});

test('UI closes one queued story at a time and replay does not modify the ledger', () => {
  const document = new FakeDocument();
  const context = testContext();
  context.runtime.handleEvent(context.state, domainEvent('game.started', { isNewSave: true }));
  context.state.stats.total.clicks = 1;
  context.runtime.handleEvent(context.state, domainEvent('work.clicked', { totalClicks: 1 }));
  const saveCount = context.saves.length;
  const ui = createStoryUI({
    document,
    getState: () => context.state,
    runtime: context.runtime,
    achievementRegistry: context.achievementRegistry,
  });
  assert.equal(ui.modal.current.story.id, 'intro.onboarding');
  assert.equal(document.body.querySelectorAll('.story-overlay').length, 1);
  let close = document.body.querySelectorAll('button').find(button => button.dataset.action === 'close-story');
  close.click();
  assert.equal(ui.modal.current.story.id, 'intro.first_wage');
  assert.equal(document.body.querySelectorAll('.story-overlay').length, 1);
  close = document.body.querySelectorAll('button').find(button => button.dataset.action === 'close-story');
  close.click();
  assert.equal(ui.modal.current, null);
  assert.equal(document.body.querySelectorAll('.story-overlay').length, 0);
  ui.archiveElement.querySelector('button').click();
  assert.equal(ui.modal.current.replay, true);
  const afterReplay = context.saves.length;
  ui.modal.close();
  assert.equal(context.saves.length, afterReplay);
  assert.equal(context.saves.length, saveCount + 2);
});
