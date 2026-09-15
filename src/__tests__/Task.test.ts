jest.mock('obsidian', () => ({
  moment: jest.fn(),
  Plugin: class {},
}));

const mockSettings = {
  includeEventsOrTodos: 'EventsAndTodos',
  ignoreCompletedTasks: false,
  ignoreCancelledTasks: true,
  ignoreOldTasks: false,
  oldTaskInDays: 365,
  howToParseInternalLinks: 'DoNotModifyThem',
};

jest.mock('../SettingsManager', () => ({
  settings: mockSettings,
}));

import { Task, createTaskFromLine } from '../Model/Task';
import { TaskDate, TaskDateName } from '../Model/TaskDate';
import { TaskStatus } from '../Model/TaskStatus';

describe('createTaskFromLine', () => {
  it('returns null when line is undefined', () => {
    expect(createTaskFromLine(undefined as unknown as string, 'obsidian://open?vault=v&file=f', null)).toBeNull();
  });

  it('returns null when line is null', () => {
    expect(createTaskFromLine(null as unknown as string, 'obsidian://open?vault=v&file=f', null)).toBeNull();
  });

  it('returns null when line is an empty string', () => {
    expect(createTaskFromLine('', 'obsidian://open?vault=v&file=f', null)).toBeNull();
  });
});

describe('createTaskFromLine: cancelled task filter', () => {
  beforeEach(() => {
    mockSettings.ignoreCancelledTasks = true;
    mockSettings.ignoreCompletedTasks = false;
    mockSettings.includeEventsOrTodos = 'EventsAndTodos';
    mockSettings.ignoreOldTasks = false;
    mockSettings.howToParseInternalLinks = 'DoNotModifyThem';
  });

  it('drops a cancelled task with a date when ignoreCancelledTasks is true', () => {
    const line = '- [-] Cancelled meeting 📅 2026-04-20';
    expect(createTaskFromLine(line, 'obsidian://open?vault=v&file=f', null)).toBeNull();
  });

  it('drops a cancelled task without a date when ignoreCancelledTasks is true and TODOs are enabled', () => {
    const line = '- [-] Cancelled chore';
    expect(createTaskFromLine(line, 'obsidian://open?vault=v&file=f', null)).toBeNull();
  });

  it('keeps a cancelled task with a date when ignoreCancelledTasks is false', () => {
    mockSettings.ignoreCancelledTasks = false;
    const line = '- [-] Cancelled meeting 📅 2026-04-20';
    const task = createTaskFromLine(line, 'obsidian://open?vault=v&file=f', null);
    expect(task).not.toBeNull();
    expect(task?.status).toBe(TaskStatus.Cancelled);
  });

  it('does not affect non-cancelled tasks (Done, ToDo, InProgress)', () => {
    mockSettings.ignoreCancelledTasks = true;
    const todoTask = createTaskFromLine('- [ ] Todo task 📅 2026-04-20', 'obsidian://open?vault=v&file=f', null);
    const doneTask = createTaskFromLine('- [x] Done task 📅 2026-04-20', 'obsidian://open?vault=v&file=f', null);
    const inProgressTask = createTaskFromLine('- [/] In progress task 📅 2026-04-20', 'obsidian://open?vault=v&file=f', null);

    expect(todoTask?.status).toBe(TaskStatus.ToDo);
    expect(doneTask?.status).toBe(TaskStatus.Done);
    expect(inProgressTask?.status).toBe(TaskStatus.InProgress);
  });

  it('honours ignoreCompletedTasks independently of ignoreCancelledTasks', () => {
    mockSettings.ignoreCancelledTasks = true;
    mockSettings.ignoreCompletedTasks = true;
    const doneTask = createTaskFromLine('- [x] Done task 📅 2026-04-20', 'obsidian://open?vault=v&file=f', null);
    const cancelledTask = createTaskFromLine('- [-] Cancelled task 📅 2026-04-20', 'obsidian://open?vault=v&file=f', null);

    expect(doneTask).toBeNull();
    expect(cancelledTask).toBeNull();
  });
});

describe('Task.getId', () => {
  const makeTask = (summary: string, fileUri: string) =>
    new Task(TaskStatus.ToDo, [], summary, fileUri);

  it('returns the same id for identical fileUri and summary', () => {
    const a = makeTask('Pay rent', 'obsidian://open?vault=v&file=notes.md');
    const b = makeTask('Pay rent', 'obsidian://open?vault=v&file=notes.md');
    expect(a.getId()).toEqual(b.getId());
  });

  it('returns different ids when summary differs', () => {
    const a = makeTask('Pay rent', 'obsidian://open?vault=v&file=notes.md');
    const b = makeTask('Pay water bill', 'obsidian://open?vault=v&file=notes.md');
    expect(a.getId()).not.toEqual(b.getId());
  });

  it('returns different ids when fileUri differs', () => {
    const a = makeTask('Pay rent', 'obsidian://open?vault=v&file=notes.md');
    const b = makeTask('Pay rent', 'obsidian://open?vault=v&file=other.md');
    expect(a.getId()).not.toEqual(b.getId());
  });

  it('returns the same id when only status differs', () => {
    const a = new Task(TaskStatus.ToDo, [], 'Pay rent', 'obsidian://open?vault=v&file=notes.md');
    const b = new Task(TaskStatus.Done, [], 'Pay rent', 'obsidian://open?vault=v&file=notes.md');
    expect(a.getId()).toEqual(b.getId());
  });

  it('handles an empty summary without throwing and is stable', () => {
    const a = makeTask('', 'obsidian://open?vault=v&file=notes.md');
    const b = makeTask('', 'obsidian://open?vault=v&file=notes.md');
    expect(a.getId()).toEqual(b.getId());
    expect(a.getId()).toMatch(/^[0-9a-f]{16}@obsidian-ical-plugin$/);
  });

  it('produces stable distinct ids for emoji and unicode summaries', () => {
    const a = makeTask('Buy 🥛 milk', 'obsidian://open?vault=v&file=notes.md');
    const b = makeTask('Buy 🥛 milk', 'obsidian://open?vault=v&file=notes.md');
    const c = makeTask('Buy 🥖 bread', 'obsidian://open?vault=v&file=notes.md');
    expect(a.getId()).toEqual(b.getId());
    expect(a.getId()).not.toEqual(c.getId());
  });

  it('produces ids in the expected hex@suffix format', () => {
    const a = makeTask('Pay rent', 'obsidian://open?vault=v&file=notes.md');
    expect(a.getId()).toMatch(/^[0-9a-f]{16}@obsidian-ical-plugin$/);
  });

  it('handles a very long summary without throwing and is stable', () => {
    const longSummary = 'x'.repeat(10000);
    const a = makeTask(longSummary, 'obsidian://open?vault=v&file=notes.md');
    const b = makeTask(longSummary, 'obsidian://open?vault=v&file=notes.md');
    expect(a.getId()).toEqual(b.getId());
    expect(a.getId()).toMatch(/^[0-9a-f]{16}@obsidian-ical-plugin$/);
  });

  // Fixes #229: old completed instances of a recurring task share a file and a
  // summary, so without the dates in the hash they all collapse to one UID and
  // the calendar keeps only one of them.
  const makeDatedTask = (summary: string, dates: TaskDate[]) =>
    new Task(TaskStatus.ToDo, dates, summary, 'obsidian://open?vault=v&file=notes.md');

  it('returns different ids for the same task text on different dates', () => {
    const a = makeDatedTask('Water the plants', [new TaskDate(new Date(2026, 3, 20), TaskDateName.Due)]);
    const b = makeDatedTask('Water the plants', [new TaskDate(new Date(2026, 3, 27), TaskDateName.Due)]);
    expect(a.getId()).not.toEqual(b.getId());
  });

  it('returns the same id for the same task text on the same date', () => {
    const a = makeDatedTask('Water the plants', [new TaskDate(new Date(2026, 3, 20), TaskDateName.Due)]);
    const b = makeDatedTask('Water the plants', [new TaskDate(new Date(2026, 3, 20), TaskDateName.Due)]);
    expect(a.getId()).toEqual(b.getId());
  });

  it('returns different ids when the same date is attached to a different date name', () => {
    const a = makeDatedTask('Water the plants', [new TaskDate(new Date(2026, 3, 20), TaskDateName.Due)]);
    const b = makeDatedTask('Water the plants', [new TaskDate(new Date(2026, 3, 20), TaskDateName.Start)]);
    expect(a.getId()).not.toEqual(b.getId());
  });

  it('returns the same id regardless of the order the dates were parsed in', () => {
    const due = new TaskDate(new Date(2026, 3, 27), TaskDateName.Due);
    const start = new TaskDate(new Date(2026, 3, 20), TaskDateName.Start);
    const a = makeDatedTask('Water the plants', [start, due]);
    const b = makeDatedTask('Water the plants', [due, start]);
    expect(a.getId()).toEqual(b.getId());
  });

  it('returns different ids for a dated task and the same task with no dates', () => {
    const a = makeDatedTask('Water the plants', [new TaskDate(new Date(2026, 3, 20), TaskDateName.Due)]);
    const b = makeDatedTask('Water the plants', []);
    expect(a.getId()).not.toEqual(b.getId());
    expect(b.getId()).toMatch(/^[0-9a-f]{16}@obsidian-ical-plugin$/);
  });

  it('treats an empty discriminator as no discriminator, so single-component ids never move', () => {
    const a = makeDatedTask('Water the plants', [new TaskDate(new Date(2026, 3, 20), TaskDateName.Due)]);
    expect(a.getId('')).toEqual(a.getId());
  });

  it('returns a different id for each discriminator', () => {
    const a = makeDatedTask('Water the plants', [
      new TaskDate(new Date(2026, 3, 20), TaskDateName.Start),
      new TaskDate(new Date(2026, 3, 27), TaskDateName.Due),
    ]);
    const ids = [a.getId(), a.getId(TaskDateName.Start), a.getId(TaskDateName.Due), a.getId('VTODO')];
    expect(new Set(ids).size).toEqual(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[0-9a-f]{16}@obsidian-ical-plugin$/));
  });
});
