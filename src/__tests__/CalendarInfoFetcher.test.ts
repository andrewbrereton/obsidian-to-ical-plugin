jest.mock('obsidian', () => ({
  Plugin: class {},
}));

import { CalendarInfoFetcher } from '../CalendarInfoFetcher';
import { ApiClient } from '../ApiClient';

type FoundCalendar = { found: true; url: string; updatedAt: string };
type NotFoundCalendar = { found: false; url: null; updatedAt: null };

function makeClient(responses: Array<FoundCalendar | NotFoundCalendar | Error>): {
  client: ApiClient;
  getCalendar: jest.Mock;
} {
  const queue = [...responses];
  const getCalendar = jest.fn().mockImplementation(() => {
    const next = queue.shift();
    if (next instanceof Error) return Promise.reject(next);
    return Promise.resolve(next);
  });
  return { client: { getCalendar } as unknown as ApiClient, getCalendar };
}

describe('CalendarInfoFetcher', () => {
  it('starts with no cached info and hasAttempted false', () => {
    const fetcher = new CalendarInfoFetcher();
    expect(fetcher.info).toBeNull();
    expect(fetcher.hasAttempted).toBe(false);
  });

  it('fetches once and caches the result', async () => {
    const { client, getCalendar } = makeClient([
      { found: true, url: 'https://x.com/cal', updatedAt: '2026-05-27T10:00:00Z' },
    ]);
    const fetcher = new CalendarInfoFetcher();

    const info = await fetcher.fetchOnce(client);
    expect(info).toEqual({ url: 'https://x.com/cal', updatedAt: '2026-05-27T10:00:00Z' });
    expect(fetcher.info).toEqual(info);
    expect(fetcher.hasAttempted).toBe(true);
    expect(getCalendar).toHaveBeenCalledTimes(1);
  });

  it('does not refetch on subsequent fetchOnce calls', async () => {
    const { client, getCalendar } = makeClient([
      { found: true, url: 'https://x.com/cal', updatedAt: '2026-05-27T10:00:00Z' },
    ]);
    const fetcher = new CalendarInfoFetcher();

    await fetcher.fetchOnce(client);
    await fetcher.fetchOnce(client);
    await fetcher.fetchOnce(client);

    expect(getCalendar).toHaveBeenCalledTimes(1);
  });

  it('dedupes concurrent fetchOnce calls', async () => {
    let resolve!: (v: FoundCalendar) => void;
    const pending = new Promise<FoundCalendar>((res) => {
      resolve = res;
    });
    const getCalendar = jest.fn().mockReturnValue(pending);
    const client = { getCalendar } as unknown as ApiClient;
    const fetcher = new CalendarInfoFetcher();

    const p1 = fetcher.fetchOnce(client);
    const p2 = fetcher.fetchOnce(client);
    resolve({ found: true, url: 'https://x.com/cal', updatedAt: '2026-05-27T10:00:00Z' });
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(getCalendar).toHaveBeenCalledTimes(1);
    expect(r1).toEqual({ url: 'https://x.com/cal', updatedAt: '2026-05-27T10:00:00Z' });
    expect(r2).toBeNull();
  });

  it('records hasAttempted even when the calendar is not found', async () => {
    const { client, getCalendar } = makeClient([
      { found: false, url: null, updatedAt: null },
    ]);
    const fetcher = new CalendarInfoFetcher();

    const info = await fetcher.fetchOnce(client);
    expect(info).toBeNull();
    expect(fetcher.hasAttempted).toBe(true);
    expect(getCalendar).toHaveBeenCalledTimes(1);

    await fetcher.fetchOnce(client);
    expect(getCalendar).toHaveBeenCalledTimes(1);
  });

  it('records hasAttempted even when getCalendar throws', async () => {
    const { client, getCalendar } = makeClient([new Error('network down')]);
    const fetcher = new CalendarInfoFetcher();

    const info = await fetcher.fetchOnce(client);
    expect(info).toBeNull();
    expect(fetcher.hasAttempted).toBe(true);
    expect(getCalendar).toHaveBeenCalledTimes(1);

    await fetcher.fetchOnce(client);
    expect(getCalendar).toHaveBeenCalledTimes(1);
  });

  it('reset() clears cache and hasAttempted so the next fetch hits the network', async () => {
    const { client, getCalendar } = makeClient([
      { found: true, url: 'https://x.com/cal-1', updatedAt: '2026-05-27T10:00:00Z' },
      { found: true, url: 'https://x.com/cal-2', updatedAt: '2026-05-27T11:00:00Z' },
    ]);
    const fetcher = new CalendarInfoFetcher();

    await fetcher.fetchOnce(client);
    expect(fetcher.info?.url).toBe('https://x.com/cal-1');

    fetcher.reset();
    expect(fetcher.hasAttempted).toBe(false);
    expect(fetcher.info).toBeNull();

    await fetcher.fetchOnce(client);
    expect(fetcher.info?.url).toBe('https://x.com/cal-2');
    expect(getCalendar).toHaveBeenCalledTimes(2);
  });

  it('forceRefetch() bypasses the once-gate and replaces the cache', async () => {
    const { client, getCalendar } = makeClient([
      { found: true, url: 'https://x.com/cal-1', updatedAt: '2026-05-27T10:00:00Z' },
      { found: true, url: 'https://x.com/cal-2', updatedAt: '2026-05-27T11:00:00Z' },
    ]);
    const fetcher = new CalendarInfoFetcher();

    await fetcher.fetchOnce(client);
    expect(fetcher.info?.url).toBe('https://x.com/cal-1');

    const refreshed = await fetcher.forceRefetch(client);
    expect(refreshed?.url).toBe('https://x.com/cal-2');
    expect(getCalendar).toHaveBeenCalledTimes(2);
  });
});

describe('CalendarInfoFetcher.lastOutcome', () => {
  it('is idle before any fetch attempt', () => {
    const fetcher = new CalendarInfoFetcher();
    expect(fetcher.lastOutcome).toBe('idle');
  });

  it('is found after a successful fetch', async () => {
    const { client } = makeClient([
      { found: true, url: 'https://x.com/cal', updatedAt: '2026-05-27T10:00:00Z' },
    ]);
    const fetcher = new CalendarInfoFetcher();
    await fetcher.fetchOnce(client);
    expect(fetcher.lastOutcome).toBe('found');
  });

  it('is not-found when the server returns no calendar', async () => {
    const { client } = makeClient([{ found: false, url: null, updatedAt: null }]);
    const fetcher = new CalendarInfoFetcher();
    await fetcher.fetchOnce(client);
    expect(fetcher.lastOutcome).toBe('not-found');
  });

  it('is error when getCalendar throws', async () => {
    const { client } = makeClient([new Error('network down')]);
    const fetcher = new CalendarInfoFetcher();
    await fetcher.fetchOnce(client);
    expect(fetcher.lastOutcome).toBe('error');
  });

  it('resets to idle on reset()', async () => {
    const { client } = makeClient([
      { found: true, url: 'https://x.com/cal', updatedAt: '2026-05-27T10:00:00Z' },
    ]);
    const fetcher = new CalendarInfoFetcher();
    await fetcher.fetchOnce(client);
    expect(fetcher.lastOutcome).toBe('found');
    fetcher.reset();
    expect(fetcher.lastOutcome).toBe('idle');
  });

  it('forceRefetch updates outcome to reflect the new result', async () => {
    const { client } = makeClient([
      { found: true, url: 'https://x.com/cal', updatedAt: '2026-05-27T10:00:00Z' },
      { found: false, url: null, updatedAt: null },
    ]);
    const fetcher = new CalendarInfoFetcher();

    await fetcher.fetchOnce(client);
    expect(fetcher.lastOutcome).toBe('found');

    await fetcher.forceRefetch(client);
    expect(fetcher.lastOutcome).toBe('not-found');
    expect(fetcher.info).toBeNull();
  });

  it('isCurrentlyFetching is false initially, true while fetching, false after resolution', async () => {
    let resolve!: (v: FoundCalendar) => void;
    const pending = new Promise<FoundCalendar>((res) => {
      resolve = res;
    });
    const getCalendar = jest.fn().mockReturnValue(pending);
    const client = { getCalendar } as unknown as ApiClient;
    const fetcher = new CalendarInfoFetcher();

    expect(fetcher.isCurrentlyFetching).toBe(false);
    const pendingFetch = fetcher.fetchOnce(client);
    expect(fetcher.isCurrentlyFetching).toBe(true);

    resolve({ found: true, url: 'https://x.com/cal', updatedAt: '2026-05-27T10:00:00Z' });
    await pendingFetch;
    expect(fetcher.isCurrentlyFetching).toBe(false);
  });

  it('isCurrentlyFetching is false after a not-found resolution', async () => {
    let resolve!: (v: NotFoundCalendar) => void;
    const pending = new Promise<NotFoundCalendar>((res) => {
      resolve = res;
    });
    const getCalendar = jest.fn().mockReturnValue(pending);
    const client = { getCalendar } as unknown as ApiClient;
    const fetcher = new CalendarInfoFetcher();

    const pendingFetch = fetcher.fetchOnce(client);
    expect(fetcher.isCurrentlyFetching).toBe(true);

    resolve({ found: false, url: null, updatedAt: null });
    await pendingFetch;
    expect(fetcher.isCurrentlyFetching).toBe(false);
  });

  it('isCurrentlyFetching is false after an error resolution', async () => {
    let reject!: (e: Error) => void;
    const pending = new Promise<FoundCalendar>((_, rej) => {
      reject = rej;
    });
    const getCalendar = jest.fn().mockReturnValue(pending);
    const client = { getCalendar } as unknown as ApiClient;
    const fetcher = new CalendarInfoFetcher();

    const pendingFetch = fetcher.fetchOnce(client);
    expect(fetcher.isCurrentlyFetching).toBe(true);

    reject(new Error('network down'));
    await pendingFetch;
    expect(fetcher.isCurrentlyFetching).toBe(false);
  });

  it('an error after a previous success replaces the outcome', async () => {
    const { client } = makeClient([
      { found: true, url: 'https://x.com/cal', updatedAt: '2026-05-27T10:00:00Z' },
      new Error('network down'),
    ]);
    const fetcher = new CalendarInfoFetcher();

    await fetcher.fetchOnce(client);
    expect(fetcher.lastOutcome).toBe('found');

    await fetcher.forceRefetch(client);
    expect(fetcher.lastOutcome).toBe('error');
  });
});
