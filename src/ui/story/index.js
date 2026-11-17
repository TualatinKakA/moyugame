import { createStoryModal, createStoryArchive, ensureStoryStyles } from './story-modal.js';
import { createAchievementPanel } from './achievement-panel.js';

export function createStoryUI({
  document,
  getState,
  runtime,
  achievementRegistry,
  computeSnapshot,
  onRead = null,
}) {
  if (typeof getState !== 'function' || !runtime || !achievementRegistry) {
    throw new TypeError('getState, runtime and achievementRegistry are required');
  }
  ensureStoryStyles(document);

  function achievementFor(story) {
    return story.achievementId ? achievementRegistry.get(story.achievementId) : null;
  }

  const modal = createStoryModal({
    document,
    onClose: ({ id, action, replay, story }) => {
      if (!replay && story.presentation?.mode === 'achievementCard') runtime.closeAchievementCard(getState(), id);
      else if (!replay) runtime.closeStory(getState(), id, { skipped: action === 'skip' });
      sync();
    },
  });

  const archive = createStoryArchive({
    document,
    onReplay: id => {
      const replay = runtime.replayStory(getState(), id);
      if (replay) modal.show({ ...replay, replay: true });
    },
  });

  const achievements = createAchievementPanel({
    document,
    getState,
    registry: achievementRegistry,
    computeSnapshot,
    onPurchase: id => {
      const result = runtime.purchase(getState(), id);
      achievements.render();
      return result;
    },
    onReplay: id => {
      const replay = runtime.replayStory(getState(), id);
      if (replay) modal.show({ ...replay, replay: true });
    },
    onRead: id => {
      if (onRead) onRead(id);
      else runtime.markAchievementRead(getState(), id);
    },
  });

  function sync() {
    const next = runtime.next(getState());
    const card = next ? null : runtime.nextCard(getState());
    if (next && modal.current?.story.id !== next.id) {
      modal.show({ story: next.story, achievement: achievementFor(next.story) });
    } else if (card && modal.current?.story.id !== card.id) {
      const paragraphs = [card.achievement.description];
      if (card.achievement.business) {
        paragraphs.push(`业务域：${card.achievement.business.scope}`);
        paragraphs.push(`职阶：${card.achievement.business.rank}`);
      }
      modal.show({
        story: {
          id: card.id,
          title: card.achievement.name,
          paragraphs,
          presentation: { mode: 'achievementCard', required: false },
          buttonLabel: '确认',
        },
      });
    }
    archive.render(runtime.archive(getState()));
    achievements.render();
  }

  function handleEvent(event) {
    const result = runtime.handleEvent(getState(), event);
    sync();
    return result;
  }

  function handleTick(at) {
    const result = runtime.handleTick(getState(), at);
    if (!result.skippedDetection) sync();
    return result;
  }

  sync();
  return Object.freeze({
    sync,
    handleEvent,
    handleTick,
    modal,
    archiveElement: archive.element,
    achievementElement: achievements.element,
    destroy: () => modal.destroy(),
  });
}

export { createStoryModal, createStoryArchive, ensureStoryStyles } from './story-modal.js';
export { createAchievementPanel } from './achievement-panel.js';
