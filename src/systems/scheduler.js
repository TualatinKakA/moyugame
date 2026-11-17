export function createScheduler() {
  const tasks = new Map();
  let sequence = 0;
  const ordered = () => [...tasks.values()].sort((a, b) => a.dueAt - b.dueAt || a.sequence - b.sequence);
  return Object.freeze({
    register(id, dueAt, payload = null) {
      if (!id || !Number.isFinite(dueAt)) throw new Error(`Invalid scheduler task: ${id}`);
      tasks.set(id, { id, dueAt, payload, sequence: sequence++ });
    },
    cancel(id) { tasks.delete(id); },
    due(now) {
      const due = ordered().filter(task => task.dueAt <= now);
      for (const task of due) tasks.delete(task.id);
      return due;
    },
    nextDueAt() { return ordered()[0]?.dueAt ?? Infinity; },
    clear() { tasks.clear(); },
    get size() { return tasks.size; },
  });
}
