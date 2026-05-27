// Minimal Obsidian mock for moment() — Task.getDate uses it.
jest.mock('obsidian', () => {
  const realModule = jest.requireActual('../../test/mocks/obsidian.js');
  return {
    ...realModule,
    moment: (input: Date | string) => {
      const d = input instanceof Date ? input : new Date(input);
      return {
        format: (fmt: string) => {
          const pad = (n: number, w = 2) => String(n).padStart(w, '0');
          return fmt
            .replace('YYYY', String(d.getFullYear()))
            .replace('MM', pad(d.getMonth() + 1))
            .replace('DD', pad(d.getDate()))
            .replace('[T]', 'T')
            .replace('HH', pad(d.getHours()))
            .replace('mm', pad(d.getMinutes()))
            .replace('ss', pad(d.getSeconds()));
        },
      };
    },
  };
});

const mockSettings = {
  isDayPlannerPluginFormatEnabled: false,
  isIncludeTasksWithTags: false,
  includeTasksWithTags: '',
  isExcludeTasksWithTags: false,
  excludeTasksWithTags: '',
  includeEventsOrTodos: 'EventsAndTodos',
  ignoreCompletedTasks: false,
  ignoreCancelledTasks: false,
  ignoreOldTasks: false,
  oldTaskInDays: 365,
  howToParseInternalLinks: 'DoNotModifyThem',
};

jest.mock('../SettingsManager', () => ({ settings: mockSettings }));

import { TaskFinder } from '../TaskFinder';
import { Headings } from '../Model/Headings';
import { TaskDateName } from '../Model/TaskDate';
import { Task } from '../Model/Task';
import type { HeadingCache, ListItemCache, TFile, Vault } from 'obsidian';

function buildFixture(content: string): {
  vault: Vault;
  file: TFile;
  listItemsCache: ListItemCache[];
} {
  const lines = content.split('\n');
  const vault = {
    cachedRead: jest.fn(async () => content),
    getName: () => 'test-vault',
  } as unknown as Vault;
  const file = {
    path: 'test.md',
    vault: { getName: () => 'test-vault' },
    // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- test fixture, not a real TFile
  } as unknown as TFile;
  const listItemsCache: ListItemCache[] = lines
    .map((line, idx) => ({ line, idx }))
    .filter(({ line }) => /^\s*-\s*\[.?\]/.test(line))
    .map(({ idx }) => ({
      position: {
        start: { line: idx, col: 0, offset: 0 },
        end: { line: idx, col: lines[idx].length, offset: 0 },
      },
    } as unknown as ListItemCache));
  return { vault, file, listItemsCache };
}

function buildHeadings(
  entries: Array<{ heading: string; line: number; level?: number }>
): Headings {
  const headingsCache: HeadingCache[] = entries.map(({ heading, line, level }) => ({
    heading,
    level: level ?? 2,
    position: {
      start: { line, col: 0, offset: 0 },
      end: { line, col: heading.length, offset: 0 },
    },
  }));
  return new Headings(headingsCache);
}

function dueDateOf(task: Task): Date | undefined {
  return task.dates.find((d) => d.name === TaskDateName.Due)?.date;
}

describe('TaskFinder.findTasks — Day Planner dateOverride scoping', () => {
  beforeEach(() => {
    mockSettings.isDayPlannerPluginFormatEnabled = false;
    mockSettings.ignoreOldTasks = false;
    mockSettings.includeEventsOrTodos = 'EventsAndTodos';
  });

  it('does NOT leak dateOverride from a timed task to a subsequent untimed task (regression for #206)', async () => {
    mockSettings.isDayPlannerPluginFormatEnabled = true;

    const { vault, file, listItemsCache } = buildFixture(
      [
        '## 2024-04-01',
        '- [ ] 10am breakfast',
        '- [ ] Buy milk 📅 2024-05-01',
      ].join('\n'),
    );
    const headings = buildHeadings([{ heading: '2024-04-01', line: 0 }]);

    const finder = new TaskFinder(vault);
    const tasks = await finder.findTasks(file, listItemsCache, headings);

    expect(tasks).toHaveLength(2);
    const buyMilk = tasks[1];
    expect(buyMilk.summary).toContain('Buy milk');

    const due = dueDateOf(buyMilk);
    expect(due).toBeDefined();
    // Critical: should be 2024-05-01 (the inline date), NOT 2024-04-01 (the
    // leaked override from the preceding Day Planner task).
    expect(due!.getFullYear()).toBe(2024);
    expect(due!.getMonth()).toBe(4); // May = 4 (zero-indexed)
    expect(due!.getDate()).toBe(1);
  });

  it('the timed task itself still gets its heading-derived date', async () => {
    mockSettings.isDayPlannerPluginFormatEnabled = true;

    const { vault, file, listItemsCache } = buildFixture(
      [
        '## 2024-04-01',
        '- [ ] 10am breakfast',
      ].join('\n'),
    );
    const headings = buildHeadings([{ heading: '2024-04-01', line: 0 }]);

    const finder = new TaskFinder(vault);
    const tasks = await finder.findTasks(file, listItemsCache, headings);

    expect(tasks).toHaveLength(1);
    const breakfast = tasks[0];
    const timeStart = breakfast.dates.find((d) => d.name === TaskDateName.TimeStart);
    expect(timeStart).toBeDefined();
    // The day component is 2024-04-01 (from the heading)
    expect(timeStart!.date.getFullYear()).toBe(2024);
    expect(timeStart!.date.getMonth()).toBe(3); // April
    expect(timeStart!.date.getDate()).toBe(1);
  });

  it('two timed tasks under different headings each get their own heading date', async () => {
    mockSettings.isDayPlannerPluginFormatEnabled = true;

    const { vault, file, listItemsCache } = buildFixture(
      [
        '## 2024-04-01',
        '- [ ] 10am breakfast',
        '## 2024-04-02',
        '- [ ] 5pm dinner',
      ].join('\n'),
    );
    const headings = buildHeadings([
      { heading: '2024-04-01', line: 0 },
      { heading: '2024-04-02', line: 2 },
    ]);

    const finder = new TaskFinder(vault);
    const tasks = await finder.findTasks(file, listItemsCache, headings);

    expect(tasks).toHaveLength(2);
    expect(tasks[0].dates.find((d) => d.name === TaskDateName.TimeStart)!.date.getDate()).toBe(1);
    expect(tasks[1].dates.find((d) => d.name === TaskDateName.TimeStart)!.date.getDate()).toBe(2);
  });

  it('untimed task BEFORE a Day Planner task is unaffected (no prior state to leak from)', async () => {
    mockSettings.isDayPlannerPluginFormatEnabled = true;

    const { vault, file, listItemsCache } = buildFixture(
      [
        '## 2024-04-01',
        '- [ ] Buy milk 📅 2024-05-01',
        '- [ ] 10am breakfast',
      ].join('\n'),
    );
    const headings = buildHeadings([{ heading: '2024-04-01', line: 0 }]);

    const finder = new TaskFinder(vault);
    const tasks = await finder.findTasks(file, listItemsCache, headings);

    expect(tasks).toHaveLength(2);
    const buyMilk = tasks[0];
    const due = dueDateOf(buyMilk);
    expect(due).toBeDefined();
    expect(due!.getMonth()).toBe(4); // May
    expect(due!.getDate()).toBe(1);
  });

  it('with Day Planner DISABLED the heading-derived override never applies', async () => {
    mockSettings.isDayPlannerPluginFormatEnabled = false;

    const { vault, file, listItemsCache } = buildFixture(
      [
        '## 2024-04-01',
        '- [ ] 10am breakfast',
        '- [ ] Buy milk 📅 2024-05-01',
      ].join('\n'),
    );
    const headings = buildHeadings([{ heading: '2024-04-01', line: 0 }]);

    const finder = new TaskFinder(vault);
    const tasks = await finder.findTasks(file, listItemsCache, headings);

    expect(tasks).toHaveLength(2);
    const buyMilk = tasks[1];
    const due = dueDateOf(buyMilk);
    expect(due).toBeDefined();
    expect(due!.getMonth()).toBe(4);
    expect(due!.getDate()).toBe(1);
  });
});
