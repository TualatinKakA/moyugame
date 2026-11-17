import { ACHIEVEMENTS } from '../../content/achievements/index.js';
import { STORIES, STORY_IMAGES } from '../../content/story/index.js';
import { createAchievementRegistry } from '../../systems/achievements.js';
import { createStoryRegistry, createStoryRuntime } from '../../systems/story.js';
import { createStoryUI } from './index.js';

export function createGameStory({
  document,
  getState,
  computeSnapshot,
  save,
  onRetire,
}) {
  const achievementRegistry = createAchievementRegistry(ACHIEVEMENTS);
  const storyRegistry = createStoryRegistry(STORIES, {
    achievementRegistry,
    images: STORY_IMAGES,
  });
  const runtime = createStoryRuntime({
    storyRegistry,
    achievementRegistry,
    computeSnapshot,
    save,
  });
  const ui = createStoryUI({
    document,
    getState,
    runtime,
    achievementRegistry,
    computeSnapshot,
    onRetire,
  });
  const disconnect = runtime.connect(getState, () => ui.sync());
  return { ui, runtime, achievementRegistry, disconnect };
}
