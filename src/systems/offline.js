export function planOfflineSegments(seconds, state, scheduler, { maxIterations = 100 } = {}) {
  const segments = [];
  let remaining = Math.max(0, seconds);
  while (remaining > 0 && segments.length < maxIterations) {
    const now = state.stats.run.time + segments.reduce((sum, segment) => sum + segment, 0);
    const nextDue = scheduler.nextDueAt();
    const duration = Number.isFinite(nextDue) && nextDue <= now + remaining
      ? Math.max(0.001, nextDue - now)
      : remaining;
    segments.push(duration);
    remaining -= duration;
  }
  return { segments, truncated: remaining > 0.001, remaining };
}
