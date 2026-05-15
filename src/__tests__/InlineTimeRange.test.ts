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
  howToProcessMultipleDates: 'PreferDueDate',
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

function ical(line: string): string {
  const task = createTaskFromLine(line, 'obsidian://open?vault=v&file=f', null);
  if (task === null) throw new Error('expected task, got null');
  return new IcalService().getCalendar([task]);
}

describe('Inline time range parsing', () => {
  it('parses `- [ ] foo 2026-04-20 17:00-19:00` (no emoji)', () => {
    const out = ical('- [ ] foo 2026-04-20 17:00-19:00');
    expect(out).toContain('DTSTART:20260420T170000');
    expect(out).toContain('DTEND:20260420T190000');
    expect(out).not.toMatch(/DTSTART:20260420\r\n/);
    expect(out).not.toContain('Z\r\n');
    expect(out).toContain('SUMMARY:🔲 foo\r\n');
    expect(out).not.toContain('17:00');
    expect(out).not.toContain('19:00');
  });

  it('parses `- [ ] foo 09:45-10:30 ⏳ 2025-06-13`', () => {
    const out = ical('- [ ] foo 09:45-10:30 ⏳ 2025-06-13');
    expect(out).toContain('DTSTART:20250613T094500');
    expect(out).toContain('DTEND:20250613T103000');
    expect(out).toContain('SUMMARY:🔲 foo\r\n');
    expect(out).not.toContain('09:45');
    expect(out).not.toContain('10:30');
  });

  it('parses `- [ ] foo 9:30 - 10:30 ⏳ 2024-07-31` (spaces around dash, single-digit hour)', () => {
    const out = ical('- [ ] foo 9:30 - 10:30 ⏳ 2024-07-31');
    expect(out).toContain('DTSTART:20240731T093000');
    expect(out).toContain('DTEND:20240731T103000');
    expect(out).toContain('SUMMARY:🔲 foo\r\n');
    expect(out).not.toContain('9:30');
    expect(out).not.toContain('10:30');
  });

  it('parses `- [ ] Call client 12:30-13:00 📅 2025-07-29` (#120 case)', () => {
    const out = ical('- [ ] Call client 12:30-13:00 📅 2025-07-29');
    expect(out).toContain('DTSTART:20250729T123000');
    expect(out).toContain('DTEND:20250729T130000');
    expect(out).toContain('SUMMARY:🔲 Call client\r\n');
    expect(out).not.toContain('12:30');
    expect(out).not.toContain('13:00');
  });

  it('does not mistake digits inside the date for a time', () => {
    // Without the lookbehind, "04-20" inside "2026-04-20" would match as a time range.
    const out = ical('- [ ] foo 2026-04-20 17:00-19:00');
    expect(out).not.toContain('DTSTART:20260420T040000');
    expect(out).not.toContain('DTSTART:20260420T200000');
  });

  it('does not match plain numbers in descriptions', () => {
    // "Buy 3 apples" — no time, only the date. Should be an all-day event.
    const out = ical('- [ ] Buy 3 apples 📅 2026-04-20');
    expect(out).toContain('DTSTART:20260420\r\n');
    expect(out).not.toMatch(/DTSTART:20260420T\d{6}/);
    expect(out).toContain('SUMMARY:🔲 Buy 3 apples\r\n');
  });

  it('preserves time text in summary when no date is present (no event anyway)', () => {
    mockSettings.includeEventsOrTodos = 'EventsAndTodos';
    mockSettings.isOnlyTasksWithoutDatesAreTodos = true;
    try {
      const out = ical('- [ ] reminder 17:00');
      // No date → becomes a VTODO. Time stays in the summary because we can't anchor it.
      expect(out).toContain('SUMMARY:🔲 reminder 17:00\r\n');
    } finally {
      mockSettings.includeEventsOrTodos = 'EventsOnly';
      mockSettings.isOnlyTasksWithoutDatesAreTodos = true;
    }
  });
});
