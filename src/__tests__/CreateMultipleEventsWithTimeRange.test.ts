(global as any).window = {
  crypto: {
    randomUUID: () => '00000000-0000-0000-0000-000000000000',
  },
};

jest.mock('obsidian', () => ({
  moment: (input: Date | string) => {
    const d = input instanceof Date ? input : new Date(input);
    return {
      format: (fmt: string) => {
        const pad = (n: number, w = 2) => String(n).padStart(w, '0');
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const mi = pad(d.getMinutes());
        const ss = pad(d.getSeconds());
        return fmt
          .replace('YYYY', String(yyyy))
          .replace('MM', mm)
          .replace('DD', dd)
          .replace('[T]', 'T')
          .replace('HH', hh)
          .replace('mm', mi)
          .replace('ss', ss);
      },
    };
  },
  Plugin: class {},
}));

const mockSettings = {
  includeEventsOrTodos: 'EventsOnly',
  howToProcessMultipleDates: 'CreateMultipleEvents',
  isIncludeLinkInDescription: false,
  isIncludeLocation: false,
  isOnlyTasksWithoutDatesAreTodos: true,
  ignoreCompletedTasks: false,
  ignoreOldTasks: false,
  howToParseInternalLinks: 'DoNotModifyThem',
};

jest.mock('../SettingsManager', () => ({
  settings: mockSettings,
}));

import { IcalService } from '../IcalService';
import { createTaskFromLine } from '../Model/Task';

function ical(line: string, dateOverride: Date | null = null): string {
  const task = createTaskFromLine(line, 'obsidian://open?vault=v&file=f', dateOverride);
  if (task === null) throw new Error('expected task, got null');
  return new IcalService().getCalendar([task]);
}

// Asserts the event is properly time-bound: timed DTSTART, DTEND, no bare all-day DTSTART.
function expectTimedEvent(out: string, startStamp: string, endStamp: string): void {
  expect(out).toContain(`DTSTART:${startStamp}`);
  expect(out).toContain(`DTEND:${endStamp}`);
  // No bare all-day DTSTART line should appear
  expect(out).not.toMatch(/DTSTART:\d{8}\r\n/);
}

describe('CreateMultipleEvents + time range (#164)', () => {
  beforeEach(() => {
    mockSettings.howToProcessMultipleDates = 'CreateMultipleEvents';
    mockSettings.includeEventsOrTodos = 'EventsOnly';
    mockSettings.isOnlyTasksWithoutDatesAreTodos = true;
  });

  describe('Day Planner override path (only TimeStart/TimeEnd produced)', () => {
    it('emits a timed event for a task under a date heading', () => {
      // Simulates a Kanban card under "## 2026-05-22": TaskFinder passes the heading's
      // date as override; TaskDate then produces only TimeStart/TimeEnd, no Scheduled.
      const out = ical('- [ ] 00:00 - 01:00 ⏳ 2026-05-22 TEST', new Date(2026, 4, 22));
      expectTimedEvent(out, '20260522T000000', '20260522T010000');
      expect(out).toContain('SUMMARY:🔲 TEST\r\n');
    });

    it('handles midnight start (00:00) without falling back to all-day', () => {
      // Regression: a "00:00 - 01:00" range under a date heading previously dropped
      // through to the all-day fallback because the CreateMultipleEvents branch
      // didn't check TimeStart/TimeEnd at all.
      const out = ical('- [ ] 00:00 - 01:00 TEST', new Date(2026, 4, 22));
      expectTimedEvent(out, '20260522T000000', '20260522T010000');
    });

    it('handles a non-midnight time range under date heading', () => {
      const out = ical('- [ ] 09:00 - 17:30 Work session', new Date(2026, 4, 22));
      expectTimedEvent(out, '20260522T090000', '20260522T173000');
    });

    it('handles AM/PM time format under date heading', () => {
      const out = ical('- [ ] 9am - 5pm Long day', new Date(2026, 4, 22));
      expectTimedEvent(out, '20260522T090000', '20260522T170000');
    });
  });

  describe('Inline time range path (Scheduled + TimeStart/TimeEnd produced)', () => {
    it('emits a single timed event, not a date-only Scheduled event', () => {
      // Inline format: no Day Planner override, the task line itself carries the
      // emoji date AND a time range. Previously this still emitted DTSTART:20260522
      // (date-only) because the Scheduled branch fired before checking TimeStart.
      const out = ical('- [ ] foo 17:00-19:00 ⏳ 2026-05-22');
      expectTimedEvent(out, '20260522T170000', '20260522T190000');
      expect(out).toContain('SUMMARY:🔲 foo\r\n');
    });

    it('prefers the time range over a Start/Due date pair', () => {
      // Even with multiple emoji dates, an inline time range should win — the
      // user explicitly asked for a timed event.
      const out = ical('- [ ] foo 09:00-10:00 🛫 2026-05-20 📅 2026-05-22');
      expectTimedEvent(out, '20260520T090000', '20260520T100000');
      expect(out).toContain('SUMMARY:🔲 foo\r\n');
    });
  });

  describe('No time range — original CreateMultipleEvents behaviour preserved', () => {
    it('still emits a Scheduled event for an emoji-only date task', () => {
      const out = ical('- [ ] foo ⏳ 2026-05-22');
      expect(out).toContain('DTSTART:20260522');
      expect(out).toContain('SUMMARY:⏳ 🔲 foo');
      expect(out).not.toMatch(/DTSTART:\d{8}T/); // no timed DTSTART
    });

    it('still emits separate Start and Due events when both are present', () => {
      const out = ical('- [ ] foo 🛫 2026-05-20 📅 2026-05-22');
      // Two VEVENT blocks, one per date
      const eventCount = (out.match(/BEGIN:VEVENT/g) ?? []).length;
      expect(eventCount).toBe(2);
      expect(out).toContain('DTSTART:20260520');
      expect(out).toContain('DTSTART:20260522');
      expect(out).toContain('SUMMARY:🛫 🔲 foo');
      expect(out).toContain('SUMMARY:📅 🔲 foo');
    });
  });

  describe('DTSTAMP, UID, and structure', () => {
    it('preserves DTSTAMP and UID lines when emitting the timed event', () => {
      const out = ical('- [ ] 00:00 - 01:00 ⏳ 2026-05-22 TEST', new Date(2026, 4, 22));
      expect(out).toMatch(/UID:[a-f0-9]+@obsidian-ical-plugin/);
      expect(out).toContain('DTSTAMP:20260522T000000');
    });

    it('emits exactly one VEVENT for a time-ranged task', () => {
      const out = ical('- [ ] 00:00 - 01:00 ⏳ 2026-05-22 TEST', new Date(2026, 4, 22));
      const beginCount = (out.match(/BEGIN:VEVENT/g) ?? []).length;
      const endCount = (out.match(/END:VEVENT/g) ?? []).length;
      expect(beginCount).toBe(1);
      expect(endCount).toBe(1);
    });
  });
});
