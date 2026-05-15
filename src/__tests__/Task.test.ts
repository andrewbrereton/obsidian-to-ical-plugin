jest.mock('obsidian', () => ({
  moment: jest.fn(),
  Plugin: class {},
}));

import { createTaskFromLine } from '../Model/Task';

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
