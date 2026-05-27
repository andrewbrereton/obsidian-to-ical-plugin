import { ApiClient } from './ApiClient';

export interface CalendarInfo {
  url: string;
  updatedAt: string;
}

// Gate around ApiClient.getCalendar() so the Settings tab only hits the
// network once per validation cycle. Previously getCalendar() fired on every
// SettingTab.display() re-render — which happens for every toggle click —
// generating a flood of HTTP requests. Reset on key change to allow a fresh
// fetch for the new key.
export class CalendarInfoFetcher {
  private hasAttemptedFetch: boolean = false;
  private isFetching: boolean = false;
  private cached: CalendarInfo | null = null;

  reset(): void {
    this.hasAttemptedFetch = false;
    this.cached = null;
  }

  get info(): CalendarInfo | null {
    return this.cached;
  }

  get hasAttempted(): boolean {
    return this.hasAttemptedFetch;
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
    this.isFetching = true;
    try {
      const response = await client.getCalendar();
      if (response.found && response.url && response.updatedAt) {
        this.cached = { url: response.url, updatedAt: response.updatedAt };
      } else {
        this.cached = null;
      }
    } catch {
      // Swallow — calendar URL just won't appear. The validation status is
      // owned by the separate ApiClient.isActive cache.
      this.cached = null;
    } finally {
      this.isFetching = false;
      this.hasAttemptedFetch = true;
    }
    return this.cached;
  }
}
