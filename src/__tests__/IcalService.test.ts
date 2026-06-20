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
import { TaskFinder } from '../TaskFinder';
import { Task } from '../Model/Task';
import { TaskDateName } from '../Model/TaskDate';
import { TaskStatus } from '../Model/TaskStatus';
import type { TFile } from 'obsidian';

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
    expect(ical).toContain('LOCATION;ALTREP=');
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
    // not iCal TEXT.
    expect(ical).toMatch(/LOCATION;ALTREP="[^"]*Meeting, 2024\.md"/);
    // The LOCATION value (after the closing quote and colon) IS TEXT and the
    // comma must be escaped.
    expect(ical).toMatch(/LOCATION;ALTREP="[^"]*":[^\r\n]*Meeting\\, 2024\.md/);
  });

  it('passes plain URLs through unchanged (regression for the common case)', () => {
    const ical = new IcalService().getCalendar([
      buildTaskWithLocation('obsidian://open?vault=v&file=note.md'),
    ]);
    expect(ical).toContain('DESCRIPTION:obsidian://open?vault=v&file=note.md');
    expect(ical).toContain('LOCATION;ALTREP="obsidian://open?vault=v&file=note.md":obsidian://open?vault=v&file=note.md');
  });
});

// Regression suite for issue #214. The fileUri passed into Task is already
// percent-encoded by TaskFinder (using encodeURIComponent on the vault name
// and file path). IcalService MUST emit it verbatim — re-encoding here would
// turn every existing %xx into %25xx and break obsidian:// links.
//
// History: issue #17 → 1.7.1 added encodeURI inside IcalService to handle
// spaces. Issue #210 fixed the missing reserved-char encoding (&, ?, #) by
// moving to encodeURIComponent at construction time in TaskFinder, but left
// the encodeURI call in place — producing the double-encoding reported in
// issue #214. The fix removes the second pass.
describe('IcalService — no double URL-encoding (issue #214)', () => {
  beforeEach(() => {
    mockSettings.isIncludeLocation = true;
    mockSettings.isIncludeLinkInDescription = true;
    mockSettings.includeEventsOrTodos = 'EventsOnly';
    mockSettings.howToProcessMultipleDates = 'PreferDueDate';
    mockSettings.isOnlyTasksWithoutDatesAreTodos = false;
  });

  function buildEventTaskWith(fileUri: string): Task {
    return new Task(
      TaskStatus.ToDo,
      [{ name: TaskDateName.Due, date: new Date(2026, 4, 15), isDateOnly: true } as any],
      'Sample task',
      fileUri,
    );
  }

  function buildTodoTaskWith(fileUri: string): Task {
    return new Task(
      TaskStatus.ToDo,
      [],
      'Sample task',
      fileUri,
    );
  }

  it('does not re-encode the percent sign — %E2 must not become %25E2', () => {
    // Reporter's exact case from issue #214: en-dash in folder name.
    const preEncoded = 'obsidian://open?vault=AL&file=07%E2%80%93Fachberater%2F2026-27%2FKT%20QuaMath%2FINFO.md';
    const ical = new IcalService().getCalendar([buildEventTaskWith(preEncoded)]);

    // ALTREP must contain the source URL byte-for-byte.
    expect(ical).toContain('LOCATION;ALTREP="' + preEncoded + '"');
    expect(ical).toContain('DESCRIPTION:' + preEncoded);

    // The double-encoded form must NOT appear anywhere in the output.
    expect(ical).not.toContain('%25E2');
    expect(ical).not.toContain('%2580');
    expect(ical).not.toContain('%2593');
    expect(ical).not.toContain('%252F');
    expect(ical).not.toContain('%2520');
  });

  it('does not re-encode %20 (space) as %2520', () => {
    const preEncoded = 'obsidian://open?vault=v&file=My%20Notes.md';
    const ical = new IcalService().getCalendar([buildEventTaskWith(preEncoded)]);
    expect(ical).toContain('LOCATION;ALTREP="' + preEncoded + '"');
    expect(ical).not.toContain('%2520');
  });

  it('does not re-encode %26 (ampersand) in a vault name', () => {
    const preEncoded = 'obsidian://open?vault=Personal%20%26%20Work&file=notes.md';
    const ical = new IcalService().getCalendar([buildEventTaskWith(preEncoded)]);
    expect(ical).toContain('LOCATION;ALTREP="' + preEncoded + '"');
    expect(ical).not.toContain('%2526');
  });

  it('does not re-encode %3F (question mark) in a file path', () => {
    const preEncoded = 'obsidian://open?vault=v&file=Where%20is%20my%20note%3F.md';
    const ical = new IcalService().getCalendar([buildEventTaskWith(preEncoded)]);
    expect(ical).toContain('LOCATION;ALTREP="' + preEncoded + '"');
    expect(ical).not.toContain('%253F');
  });

  it('does not re-encode %23 (hash) in a file path', () => {
    const preEncoded = 'obsidian://open?vault=v&file=daily%23note.md';
    const ical = new IcalService().getCalendar([buildEventTaskWith(preEncoded)]);
    expect(ical).toContain('LOCATION;ALTREP="' + preEncoded + '"');
    expect(ical).not.toContain('%2523');
  });

  it('does not re-encode %2C (comma) in a file path', () => {
    const preEncoded = 'obsidian://open?vault=v&file=Meeting%2C%202024.md';
    const ical = new IcalService().getCalendar([buildEventTaskWith(preEncoded)]);
    expect(ical).toContain('LOCATION;ALTREP="' + preEncoded + '"');
    expect(ical).not.toContain('%252C');
  });

  it('does not re-encode %2F (path separator) in a deep folder path', () => {
    const preEncoded = 'obsidian://open?vault=v&file=a%2Fb%2Fc%2Fd.md';
    const ical = new IcalService().getCalendar([buildEventTaskWith(preEncoded)]);
    expect(ical).toContain('LOCATION;ALTREP="' + preEncoded + '"');
    expect(ical).not.toContain('%252F');
  });

  it('also passes the encoded URL through unchanged in VTODO output', () => {
    mockSettings.includeEventsOrTodos = 'TodosOnly';
    const preEncoded = 'obsidian://open?vault=AL&file=07%E2%80%93Fachberater%2FINFO.md';
    const ical = new IcalService().getCalendar([buildTodoTaskWith(preEncoded)]);
    expect(ical).toContain('BEGIN:VTODO');
    expect(ical).toContain('LOCATION;ALTREP="' + preEncoded + '"');
    expect(ical).not.toContain('%25E2');
  });

  it('leaves a plain ASCII URL unchanged (no encoding needed, no encoding done)', () => {
    const plain = 'obsidian://open?vault=v&file=folder%2Fnote.md';
    const ical = new IcalService().getCalendar([buildEventTaskWith(plain)]);
    expect(ical).toContain('LOCATION;ALTREP="' + plain + '"');
    expect(ical).toContain('DESCRIPTION:' + plain);
  });

  it('round-trips: decoding the emitted ALTREP value yields the original file path', () => {
    // Simulates what a calendar app does when it opens the obsidian:// link.
    const vaultName = 'Personal & Work';
    const filePath = '07–Fachberater/2026-27/KT QuaMath/INFO.md';
    const preEncoded =
      'obsidian://open?vault=' + encodeURIComponent(vaultName) +
      '&file=' + encodeURIComponent(filePath);

    const ical = new IcalService().getCalendar([buildEventTaskWith(preEncoded)]);
    const altrep = ical.match(/LOCATION;ALTREP="([^"]+)"/)?.[1];
    expect(altrep).toBeDefined();

    const url = new URL(altrep!);
    expect(decodeURIComponent(url.searchParams.get('vault') ?? '')).toBe(vaultName);
    expect(decodeURIComponent(url.searchParams.get('file') ?? '')).toBe(filePath);
  });

  it('end-to-end through TaskFinder: deep folder path with en-dash yields a single-encoded URL', async () => {
    // Reproduces issue #214 end-to-end. TaskFinder is the only producer of
    // fileUri in production, so any encoding contract is "TaskFinder writes,
    // IcalService passes through". This test pins both sides together.
    const fileBody = '- [ ] Reporter case 📅 2024-05-01';
    const vault = {
      cachedRead: jest.fn().mockResolvedValue(fileBody),
    } as unknown as ConstructorParameters<typeof TaskFinder>[0];
    const file = {
      path: '07–Fachberater/2026-27/KT QuaMath/INFO.md',
      vault: { getName: () => 'AL' },
      // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- test fixture
    } as unknown as TFile;
    const listItemsCache = [{ position: { start: { line: 0 } } } as any];

    const finder = new TaskFinder(vault);
    const tasks = await finder.findTasks(file, listItemsCache, undefined);
    expect(tasks).toHaveLength(1);

    const ical = new IcalService().getCalendar(tasks);

    // ALTREP should contain exactly one encoding pass — en-dash as %E2%80%93,
    // path separator as %2F, space as %20. Critically: no %25 anywhere.
    expect(ical).toContain('%E2%80%93Fachberater');
    expect(ical).toContain('KT%20QuaMath');
    expect(ical).toContain('%2FINFO.md');
    expect(ical).not.toMatch(/%25[0-9A-F]{2}/i);
  });
});
