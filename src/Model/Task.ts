import 'crypto';
import { moment } from 'obsidian';
import { TaskDate, TaskDateName, getTaskDatesFromMarkdown } from './TaskDate';
import { TaskStatus, getTaskStatusEmoji, getTaskStatusFromMarkdown } from './TaskStatus';
import { getSummaryFromMarkdown } from './TaskSummary';

export class Task {
  public status: TaskStatus;
  dates: TaskDate[];
  public summary: string;
  fileUri: string;

  constructor(
    status: TaskStatus,
    dates: TaskDate[],
    summary: string,
    fileUri: string,
  ) {
    this.status = status;
    this.dates = dates;
    this.summary = summary;
    this.fileUri = fileUri;
  }

  public getId(): string {
    return crypto.randomUUID();
  }

  public hasA(taskDateName: TaskDateName): boolean {
    return this.dates.some((taskDate: TaskDate) => {
      return taskDate.name === taskDateName;
    });
  }

  public hasAnyDate(): boolean {
    return this.dates.length > 0;
  }

  public getDate(taskDateName: TaskDateName | null, format: string): string {
    // If there are not dates, then return an empty string
    // This happens when TODOs are included as they don't require a date
    if (this.dates.length === 0) {
      return '';
    }

    // HACK: If taskDateName is null then just use the first date that we know about
    if (taskDateName === null) {
      taskDateName = this.dates[0].name;
    }

    const matchingTaskDate = this.dates.find((taskDate: TaskDate) => {
      if (taskDate.name === taskDateName) {
        return taskDate.date;
      }
    });

    return matchingTaskDate ? moment(matchingTaskDate.date).format(format) : '';
  }

  public getSummary(): string {
    const summary = this.summary
      .replace(/\\/gm, '\\\\')
      .replace(/\r?\n/gm, '\\n')
      .replace(/;/gm, '\\;')
      .replace(/,/gm, '\\,');

    const emoji = getTaskStatusEmoji(this.status);

    return `${emoji} ${summary}`;
  }

  public getLocation(): string {
    return this.fileUri;
  }
}

export function createTaskFromLine(line: string, fileUri: string, howToParseInternalLinks: string, ignoreCompletedTasks: boolean, ignoreOldTasks: boolean, oldTaskInDays: number, isIncludeTodos: boolean): Task|null {
  const taskRegExp = /(\*|-)\s*(?<taskStatus>\[.?])\s*(?<summary>.*)\s*/gi;
  const dateRegExp = /\b(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\b/gi;

  const taskMatch = [...line.matchAll(taskRegExp)][0] ?? null;

  // This isn't a task. Bail.
  if (taskMatch === null) {
    return null;
  }

  const dateMatch = [...line.matchAll(dateRegExp)][0] ?? null;

  // This task doesn't have a date and we are not including TODO items. Bail.
  if (dateMatch === null && isIncludeTodos === false) {
    return null;
  }

  // Extract the Task data points from the matches
  const taskStatus = getTaskStatusFromMarkdown(taskMatch?.groups?.taskStatus ?? '');

  // Task is done and user wants to ignore completed tasks. Bail.
  if (taskStatus === TaskStatus.Done && ignoreCompletedTasks === true) {
    return null;
  }

  const taskDates = getTaskDatesFromMarkdown(line);

  // Ignore old tasks is enabled, and all of the task's dates are after the retention period. Bail.
  if (ignoreOldTasks === true) {
    const now = new Date();
    const thresholdDate = new Date(now.setDate(now.getDate() - oldTaskInDays));

    const isAllDatesOld = taskDates.every((taskDate: TaskDate) => {
      return taskDate.date < thresholdDate;
    });

    if (isAllDatesOld === true) {
      return null;
    }
  }

  const summary = getSummaryFromMarkdown(taskMatch?.groups?.summary ?? '', howToParseInternalLinks);

  return new Task(taskStatus, taskDates, summary, fileUri);
}
