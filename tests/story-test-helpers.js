import { createState } from '../src/core/state.js';
import { migrateGameStateToSchema3 } from '../src/core/story-state.js';
import { ACHIEVEMENTS } from '../src/content/achievements/index.js';
import { STORIES, STORY_IMAGES } from '../src/content/story/index.js';
import { createAchievementRegistry } from '../src/systems/achievements.js';
import { createStoryRegistry, createStoryRuntime } from '../src/systems/story.js';

export function testContext({ save, computeSnapshot, now = () => 1000 } = {}) {
  const state = migrateGameStateToSchema3(createState());
  const achievementRegistry = createAchievementRegistry(ACHIEVEMENTS);
  const storyRegistry = createStoryRegistry(STORIES, {
    achievementRegistry,
    images: STORY_IMAGES,
  });
  const saves = [];
  const persist = save || (current => saves.push(JSON.parse(JSON.stringify(current))));
  const runtime = createStoryRuntime({
    storyRegistry,
    achievementRegistry,
    computeSnapshot,
    save: persist,
    now,
  });
  return { state, achievementRegistry, storyRegistry, runtime, saves, save: persist };
}

export function domainEvent(type, data = {}, at = 1000) {
  return { type, data, at };
}
