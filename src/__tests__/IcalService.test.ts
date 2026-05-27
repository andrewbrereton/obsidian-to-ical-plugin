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
  isIncludeLocation: true,
  isOnlyTasksWithoutDatesAreTodos: true,
};

jest.mock('../SettingsManager', () => ({
  settings: mockSettings,
}));

import { IcalService } from '../IcalService';
import { Task } from '../Model/Task';
import { TaskDateName } from '../Model/TaskDate';
import { TaskStatus } from '../Model/TaskStatus';

function buildTaskWithDueDate(): Task {
  const dueDate = new Date(2026, 4, 15);
  return new Task(
    TaskStatus.ToDo,
    [{ name: TaskDateName.Due, date: dueDate, isDateOnly: true } as any],
    'Sample task',
    'obsidian://open?vault=v&file=f',
  );
}

describe('IcalService location toggle', () => {
  beforeEach(() => {
    mockSettings.isIncludeLocation = true;
    mockSettings.includeEventsOrTodos = 'EventsOnly';
    mockSettings.howToProcessMultipleDates = 'PreferDueDate';
    mockSettings.isIncludeLinkInDescription = false;
  });

  it('includes LOCATION line in VEVENT when isIncludeLocation is true', () => {
    mockSettings.isIncludeLocation = true;
    const ical = new IcalService().getCalendar([buildTaskWithDueDate()]);
    expect(ical).toContain('LOCATION:ALTREP=');
  });

  it('omits LOCATION line in VEVENT when isIncludeLocation is false', () => {
    mockSettings.isIncludeLocation = false;
    const ical = new IcalService().getCalendar([buildTaskWithDueDate()]);
    expect(ical).not.toContain('LOCATION:');
  });

  it('omits LOCATION line in VTODO when isIncludeLocation is false', () => {
    mockSettings.isIncludeLocation = false;
    mockSettings.includeEventsOrTodos = 'TodosOnly';
    mockSettings.isOnlyTasksWithoutDatesAreTodos = false;
    const ical = new IcalService().getCalendar([buildTaskWithDueDate()]);
    expect(ical).toContain('BEGIN:VTODO');
    expect(ical).not.toContain('LOCATION:');
  });
});

describe('IcalService CreateMultipleEvents — Done date', () => {
  beforeEach(() => {
    mockSettings.isIncludeLocation = true;
    mockSettings.includeEventsOrTodos = 'EventsOnly';
    mockSettings.howToProcessMultipleDates = 'CreateMultipleEvents';
    mockSettings.isIncludeLinkInDescription = false;
  });

  it('emits an event on the done date', () => {
    const dueDate = new Date(2026, 4, 15);
    const doneDate = new Date(2026, 4, 18);
    const task = new Task(
      TaskStatus.Done,
      [
        { name: TaskDateName.Due, date: dueDate, isDateOnly: true } as any,
        { name: TaskDateName.Done, date: doneDate, isDateOnly: true } as any,
      ],
      'Sample task',
      'obsidian://open?vault=v&file=f',
    );
    const ical = new IcalService().getCalendar([task]);
    expect(ical).toContain('DTSTART:20260515');
    expect(ical).toContain('DTSTART:20260518');
    expect(ical).toContain('SUMMARY:✅ ');
  });

  it('does not emit a done event when no done date is present', () => {
    const dueDate = new Date(2026, 4, 15);
    const task = new Task(
      TaskStatus.ToDo,
      [{ name: TaskDateName.Due, date: dueDate, isDateOnly: true } as any],
      'Sample task',
      'obsidian://open?vault=v&file=f',
    );
    const ical = new IcalService().getCalendar([task]);
    expect(ical).toContain('DTSTART:20260515');
    expect(ical).not.toContain('SUMMARY:✅ ');
  });
});

describe('IcalService UID stability across exports', () => {
  beforeEach(() => {
    mockSettings.isIncludeLocation = true;
    mockSettings.includeEventsOrTodos = 'EventsOnly';
    mockSettings.howToProcessMultipleDates = 'PreferDueDate';
    mockSettings.isIncludeLinkInDescription = false;
  });

  it('emits the same UID for the same task across two exports', () => {
    const extractUids = (ical: string) => ical.match(/^UID:.*$/gm) ?? [];
    const first = new IcalService().getCalendar([buildTaskWithDueDate()]);
    const second = new IcalService().getCalendar([buildTaskWithDueDate()]);
    const firstUids = extractUids(first);
    const secondUids = extractUids(second);
    expect(firstUids.length).toBeGreaterThan(0);
    expect(firstUids).toEqual(secondUids);
  });

  it('emits a different UID when summary changes', () => {
    const extractUids = (ical: string) => ical.match(/^UID:.*$/gm) ?? [];
    const original = new IcalService().getCalendar([buildTaskWithDueDate()]);
    const edited = new IcalService().getCalendar([
      new Task(
        TaskStatus.ToDo,
        [{ name: TaskDateName.Due, date: new Date(2026, 4, 15), isDateOnly: true } as any],
        'Sample task — edited',
        'obsidian://open?vault=v&file=f',
      ),
    ]);
    expect(extractUids(original)).not.toEqual(extractUids(edited));
  });
});

describe('IcalService DESCRIPTION/LOCATION iCal-escaping', () => {
  beforeEach(() => {
    mockSettings.isIncludeLocation = true;
    mockSettings.isIncludeLinkInDescription = true;
    mockSettings.includeEventsOrTodos = 'EventsOnly';
    mockSettings.howToProcessMultipleDates = 'PreferDueDate';
  });

  function buildTaskWithLocation(fileUri: string): Task {
    return new Task(
      TaskStatus.ToDo,
      [{ name: TaskDateName.Due, date: new Date(2026, 4, 15), isDateOnly: true } as any],
      'Sample task',
      fileUri,
    );
  }

  it('escapes commas in the DESCRIPTION value when the file path contains them', () => {
    const ical = new IcalService().getCalendar([
      buildTaskWithLocation('obsidian://open?vault=v&file=Meeting, 2024.md'),
    ]);
    // Comma in the URL must be backslash-escaped per RFC 5545 §3.3.11.
    expect(ical).toMatch(/DESCRIPTION:[^\r\n]*Meeting\\,/);
    expect(ical).not.toMatch(/DESCRIPTION:[^\r\n]*Meeting,/);
  });

  it('escapes semicolons in the DESCRIPTION value', () => {
    const ical = new IcalService().getCalendar([
      buildTaskWithLocation('obsidian://open?vault=v&file=a;b.md'),
    ]);
    expect(ical).toMatch(/DESCRIPTION:[^\r\n]*a\\;b/);
  });

  it('escapes commas in the LOCATION TEXT value but NOT inside the ALTREP DQUOTE parameter', () => {
    const ical = new IcalService().getCalendar([
      buildTaskWithLocation('obsidian://open?vault=v&file=Meeting, 2024.md'),
    ]);
    // The ALTREP parameter (inside DQUOTE) keeps the raw comma — it's a URI,
    // not iCal TEXT. encodeURI URL-encodes the space to %20 but leaves , alone.
    expect(ical).toMatch(/LOCATION:ALTREP="[^"]*Meeting,%202024\.md"/);
    // The LOCATION value (after the closing quote and colon) IS TEXT and the
    // comma must be escaped.
    expect(ical).toMatch(/LOCATION:ALTREP="[^"]*":[^\r\n]*Meeting\\,%202024\.md/);
  });

  it('passes plain URLs through unchanged (regression for the common case)', () => {
    const ical = new IcalService().getCalendar([
      buildTaskWithLocation('obsidian://open?vault=v&file=note.md'),
    ]);
    expect(ical).toContain('DESCRIPTION:obsidian://open?vault=v&file=note.md');
    expect(ical).toContain('LOCATION:ALTREP="obsidian://open?vault=v&file=note.md":obsidian://open?vault=v&file=note.md');
  });
});
