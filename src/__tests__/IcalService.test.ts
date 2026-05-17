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
