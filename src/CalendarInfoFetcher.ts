import { ApiClient } from './ApiClient';

export interface CalendarInfo {
  url: string;
  updatedAt: string;
}

// Tracks why the last fetch attempt returned what it did, so callers (e.g.
// the SettingTab Refresh button) can distinguish "the server says no
// calendar exists" from "we couldn't reach the server" — those need
// different Notice messages.
export type FetchOutcome = 'idle' | 'found' | 'not-found' | 'error';

// Gate around ApiClient.getCalendar() so the Settings tab only hits the
// network once per validation cycle. Previously getCalendar() fired on every
// SettingTab.display() re-render — which happens for every toggle click —
// generating a flood of HTTP requests. Reset on key change to allow a fresh
// fetch for the new key.
export class CalendarInfoFetcher {
  private hasAttemptedFetch: boolean = false;
  private isFetching: boolean = false;
  private cached: CalendarInfo | null = null;
  private outcome: FetchOutcome = 'idle';
  // Incremented by reset(). runFetch captures it at the start and discards
  // its result on completion if the value has changed — i.e. if a
  // reset()/secretKey change invalidated the request mid-flight. Without
  // this guard the in-flight fetch's finally block would overwrite freshly
  // reset state with the stale-key result.
  private currentToken: number = 0;

  reset(): void {
    this.hasAttemptedFetch = false;
    this.cached = null;
    this.outcome = 'idle';
    this.currentToken++;
    // Abandon the tracking for any in-flight fetch. The actual network call
    // keeps running but its result will be dropped via the token check —
    // letting it block isFetching would gate the next fetchOnce until the
    // old call resolves, which can strand the UI on the empty-state
    // placeholder after a key-change race.
    this.isFetching = false;
  }

  get info(): CalendarInfo | null {
    return this.cached;
  }

  get hasAttempted(): boolean {
    return this.hasAttemptedFetch;
  }

  get lastOutcome(): FetchOutcome {
    return this.outcome;
  }

  get isCurrentlyFetching(): boolean {
    return this.isFetching;
  }

  async fetchOnce(client: ApiClient): Promise<CalendarInfo | null> {
    if (this.hasAttemptedFetch || this.isFetching) {
      return this.cached;
    }
    return this.runFetch(client);
  }

  async forceRefetch(client: ApiClient): Promise<CalendarInfo | null> {
    if (this.isFetching) {
      return this.cached;
    }
    this.reset();
    return this.runFetch(client);
  }

  private async runFetch(client: ApiClient): Promise<CalendarInfo | null> {
    const myToken = this.currentToken;
    this.isFetching = true;
    let nextCached: CalendarInfo | null = null;
    let nextOutcome: FetchOutcome;
    try {
      const response = await client.getCalendar();
      if (response.found && response.url && response.updatedAt) {
        nextCached = { url: response.url, updatedAt: response.updatedAt };
        nextOutcome = 'found';
      } else {
        nextOutcome = 'not-found';
      }
    } catch {
      // The validation status is owned by the separate ApiClient.isActive
      // cache; failures here only affect the calendar URL display.
      nextOutcome = 'error';
    }
    // Stale completion: a reset() (and possibly a new runFetch) happened
    // while we were awaiting. Don't apply state — and don't touch
    // isFetching, since a newer fetch may now own it.
    if (myToken !== this.currentToken) {
      return null;
    }
    this.isFetching = false;
    this.cached = nextCached;
    this.outcome = nextOutcome;
    this.hasAttemptedFetch = true;
    return this.cached;
  }
}
