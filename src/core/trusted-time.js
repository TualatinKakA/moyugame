export async function createTrustedTime({
  href = globalThis.location?.href || 'http://127.0.0.1/',
  hostname = globalThis.location?.hostname || '127.0.0.1',
  fetchImpl = globalThis.fetch,
  wallNow = () => Date.now(),
  monotonicNow = () => performance.now(),
} = {}) {
  let baseWall = wallNow();
  let baseMonotonic = monotonicNow();
  let verified = false;
  const now = () => baseWall + (monotonicNow() - baseMonotonic);

  async function refresh() {
    if (!hostname.endsWith('.github.io') || !fetchImpl) return false;
    try {
      const url = new URL('./', href);
      url.searchParams.set('__time', crypto.randomUUID());
      const startedAt = monotonicNow();
      const response = await fetchImpl(url, { cache: 'no-store' });
      const roundTrip = monotonicNow() - startedAt;
      const serverDate = Date.parse(response.headers.get('Date'));
      const age = Number(response.headers.get('Age') || 0) * 1000;
      if (!response.ok || !Number.isFinite(serverDate) || !Number.isFinite(age)) return false;
      const candidate = serverDate + age + roundTrip / 2;
      const nextMonotonic = monotonicNow();
      baseWall = Math.max(candidate, now());
      baseMonotonic = nextMonotonic;
      verified = true;
      return true;
    } catch {
      return false;
    }
  }

  await refresh();
  return Object.freeze({ now, refresh, isVerified: () => verified });
}
