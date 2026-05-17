jest.mock('obsidian', () => ({
  moment: jest.fn(),
  Plugin: class {},
}));

import { Task, createTaskFromLine } from '../Model/Task';
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
});
