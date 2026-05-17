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
});
