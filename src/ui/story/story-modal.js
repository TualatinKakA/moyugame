export function ensureStoryStyles(document) {
  if (document.querySelector('link[data-story-styles]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./story.css', import.meta.url).href;
  link.dataset.storyStyles = 'true';
  (document.head || document.body).appendChild(link);
}

function element(document, tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function focusable(panel) {
  return [...panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter(node => !node.disabled && !node.hidden);
}

export function createStoryModal({ document, onClose = () => {} }) {
  ensureStoryStyles(document);
  let overlay = null;
  let current = null;
  let previousFocus = null;
  let previousOverflow = '';
  let keyHandler = null;

  function cleanup() {
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
    overlay?.remove();
    overlay = null;
    if (document.body) document.body.style.overflow = previousOverflow;
    if (previousFocus && typeof previousFocus.focus === 'function') {
      try { previousFocus.focus({ preventScroll: true }); } catch { previousFocus.focus(); }
    }
    previousFocus = null;
  }

  function finish(action) {
    if (!current) return;
    const completed = current;
    cleanup();
    current = null;
    onClose({ id: completed.story.id, action, replay: completed.replay, story: completed.story });
  }

  function handleKey(event) {
    if (!current) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      finish('close');
      return;
    }
    if (event.key !== 'Tab' || !overlay) return;
    const panel = overlay.querySelector('.story-modal');
    const nodes = focusable(panel);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function show({ story, achievement = null, replay = false }) {
    if (!story) throw new TypeError('Story is required');
    if (overlay) cleanup();
    current = { story, achievement, replay };
    previousFocus = document.activeElement;
    previousOverflow = document.body?.style?.overflow || '';
    if (document.body) document.body.style.overflow = 'hidden';

    overlay = element(document, 'div', 'story-overlay');
    overlay.dataset.storyId = story.id;
    const panel = element(document, 'section', 'story-modal');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    const titleId = `story-title-${story.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    panel.setAttribute('aria-labelledby', titleId);

    const eyebrow = element(document, 'p', 'story-eyebrow', replay ? '剧情回看' : '员工档案记录');
    const title = element(document, 'h2', 'story-title', story.title);
    title.id = titleId;
    panel.append(eyebrow, title);

    if (story.image) {
      const figure = element(document, 'figure', 'story-figure');
      const image = element(document, 'img', 'story-image');
      image.src = new URL(`../../../${story.image}`, import.meta.url).href;
      image.alt = story.imageAlt;
      image.width = 960;
      image.height = 540;
      const fallback = element(document, 'figcaption', 'story-image-fallback', story.imageAlt);
      fallback.hidden = true;
      image.addEventListener('error', () => {
        image.hidden = true;
        fallback.hidden = false;
      });
      figure.append(image, fallback);
      panel.appendChild(figure);
    }

    const body = element(document, 'div', 'story-body');
    for (const text of story.paragraphs) body.appendChild(element(document, 'p', 'story-paragraph', text));
    panel.appendChild(body);

    if (achievement) {
      const card = element(document, 'aside', 'story-achievement');
      card.append(
        element(document, 'span', 'story-achievement-label', replay ? '关联奖杯' : '获得奖杯'),
        element(document, 'strong', 'story-achievement-name', achievement.name),
        element(document, 'p', 'story-achievement-description', achievement.description),
      );
      panel.appendChild(card);
    }

    const actions = element(document, 'div', 'story-actions');
    if (!replay && story.presentation?.required === false) {
      const skip = element(document, 'button', 'story-button story-button-secondary', '跳过');
      skip.type = 'button';
      skip.dataset.action = 'skip-story';
      skip.addEventListener('click', () => finish('skip'));
      actions.appendChild(skip);
    }
    const close = element(document, 'button', 'story-button story-button-primary', replay ? '关闭回看' : (story.buttonLabel || '继续'));
    close.type = 'button';
    close.dataset.action = 'close-story';
    close.addEventListener('click', () => finish('close'));
    actions.appendChild(close);
    panel.appendChild(actions);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    keyHandler = handleKey;
    document.addEventListener('keydown', keyHandler);
    close.focus();
    return overlay;
  }

  return Object.freeze({
    show,
    close: () => finish('close'),
    get current() { return current; },
    get isOpen() { return Boolean(current); },
    destroy: () => { cleanup(); current = null; },
  });
}

export function createStoryArchive({ document, onReplay = () => {} }) {
  ensureStoryStyles(document);
  const root = element(document, 'section', 'story-archive');
  root.setAttribute('aria-label', '剧情回看');
  root.append(
    element(document, 'h2', 'story-section-title', '剧情回看'),
    element(document, 'p', 'story-section-description', '已阅读或跳过的员工档案可以在这里重新查看。'),
  );
  const list = element(document, 'div', 'story-archive-list');
  root.appendChild(list);

  function render(entries = []) {
    list.replaceChildren();
    if (!entries.length) {
      list.appendChild(element(document, 'p', 'story-empty', '暂无可回看的剧情。'));
      return;
    }
    for (const entry of [...entries].reverse()) {
      const button = element(document, 'button', 'story-archive-item');
      button.type = 'button';
      button.dataset.storyId = entry.id;
      button.append(
        element(document, 'span', 'story-archive-title', entry.story.title),
        element(document, 'span', 'story-archive-action', '回看'),
      );
      button.addEventListener('click', () => onReplay(entry.id));
      list.appendChild(button);
    }
  }

  render();
  return Object.freeze({ element: root, render });
}
