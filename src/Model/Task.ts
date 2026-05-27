import { moment } from 'obsidian';
import { TaskDate, TaskDateName, getTaskDatesFromMarkdown, hasTime } from './TaskDate';
import { TaskStatus, getTaskStatusEmoji, getTaskStatusFromMarkdown } from './TaskStatus';
import { getSummaryFromMarkdown } from './TaskSummary';
import { settings } from '../SettingsManager';
import { escapeICalText } from '../iCalText';

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
    const input = `${this.fileUri}::${this.summary}`;
    let h1 = 0x811c9dc5 >>> 0;
    let h2 = 0x9e3779b9 >>> 0;
    for (let i = 0; i < input.length; i++) {
      const c = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
      h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0;
    }
    return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0') + '@obsidian-ical-plugin';
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

    if (typeof matchingTaskDate === 'undefined') {
      return '';
    }

    // If the Task has its time set, then it has been set because we are have found a Day Planner plugin
    // task. The time is in local timezone, so we need to convert it to UTC.
    if (hasTime(matchingTaskDate)) {
      // NOTE: This is adding the local timezone to the time. i.e.: we no longer need to use the utc() method.
      // return moment(matchingTaskDate.date).utc().format(format);
      return moment(matchingTaskDate.date).format(format);
    } else {
      return moment(matchingTaskDate.date).format(format);
    }
  }

  public getSummary(): string {
    const summary = escapeICalText(this.summary);
    const emoji = getTaskStatusEmoji(this.status);
    return `${emoji} ${summary}`;
  }

  public getLocation(): string {
    return this.fileUri;
  }
}

export function createTaskFromLine(line: string, fileUri: string, dateOverride: Date|null): Task|null {
  if (!line) {
    return null;
  }

  const taskRegExp = /(\*|-)\s*(?<taskStatus>\[.?])\s*(?<summary>.*)\s*/gi;
  const dateRegExp = /\b(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\b/gi;

  const taskMatch = [...line.matchAll(taskRegExp)][0] ?? null;

  // This isn't a task. Bail.
  if (taskMatch === null) {
    return null;
  }

  const dateMatch = [...line.matchAll(dateRegExp)][0] ?? null;

  // This task doesn't have a date and we are not including TODO items. Bail.
  if ((dateMatch === null && dateOverride === null) && settings.includeEventsOrTodos === 'EventsOnly') {
    return null;
  }

  // Extract the Task data points from the matches
  const taskStatus = getTaskStatusFromMarkdown(taskMatch?.groups?.taskStatus ?? '');

  // Task is done and user wants to ignore completed tasks. Bail.
  if (taskStatus === TaskStatus.Done && settings.ignoreCompletedTasks === true) {
    return null;
  }

  // Task is cancelled and user wants to ignore cancelled tasks. Bail.
  if (taskStatus === TaskStatus.Cancelled && settings.ignoreCancelledTasks === true) {
    return null;
  }

  const taskDates = getTaskDatesFromMarkdown(line, dateOverride);

  // Ignore old tasks is enabled, and all of the task's dates are after the retention period. Bail.
  if (settings.ignoreOldTasks === true) {
    const now = new Date();
    const thresholdDate = new Date(now.setDate(now.getDate() - settings.oldTaskInDays));

    const isAllDatesOld = taskDates.every((taskDate: TaskDate) => {
      return taskDate.date < thresholdDate;
    });

    if (isAllDatesOld === true) {
      return null;
    }
  }

  const summary = getSummaryFromMarkdown(taskMatch?.groups?.summary ?? '', settings.howToParseInternalLinks);

  return new Task(taskStatus, taskDates, summary, fileUri);
}
