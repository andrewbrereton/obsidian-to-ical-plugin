import { TaskStatus, getTaskStatusFromMarkdown, getTaskStatusEmoji } from "./TaskStatus";
import "crypto";
import { moment } from "obsidian";
import { TaskDate, TaskDateName, getTaskDatesFromMarkdown } from "./TaskDate";
import { getSummaryFromMarkdown } from "./TaskSummary";

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

  public getDate(taskDateName: TaskDateName | null, format: string): string {
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
      .replace(/\\/gm, "\\\\")
      .replace(/\r?\n/gm, "\\n")
      .replace(/;/gm, "\\;")
      .replace(/,/gm, "\\,");

    const emoji = getTaskStatusEmoji(this.status);

    return `${emoji} ${summary}`;
  }

  public getLocation(): string {
    return this.fileUri;
  }

  public isInThePast(): boolean {
    const taskDate = this.getDate(TaskDateName.Due, 'YYYY-MM-DD')
    const now = moment().format('YYYY-MM-DD');

    return taskDate <= now;
  }
}

export function createTaskFromLine(line: string, fileUri: string, howToParseInternalLinks: string, ignoreCompletedTasks: boolean): Task|null {
  const taskRegExp = /(\*|-)\s*(?<taskStatus>\[.?])\s*(?<summary>.*)\s*/gi;
  const dateRegExp = /\b(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\b/gi;

  const taskMatch = [...line.matchAll(taskRegExp)][0] ?? null;

  // This isn't a task. Bail.
  if (taskMatch === null) {
    return null;
  }

  const dateMatch = [...line.matchAll(dateRegExp)][0] ?? null;

  // This task doesn't have a date. Bail.
  if (dateMatch === null) {
    return null;
  }

  // Extract the Task data points from the matches
  const taskStatus = getTaskStatusFromMarkdown(taskMatch?.groups?.taskStatus ?? '');

  // Task is done and user wants to ignore completed tasks. Bail.
  if (taskStatus === TaskStatus.Done && ignoreCompletedTasks === true) {
    return null;
  }

  const taskDates = getTaskDatesFromMarkdown(line);
  const summary = getSummaryFromMarkdown(taskMatch?.groups?.summary ?? '', howToParseInternalLinks);

  return new Task(taskStatus, taskDates, summary, fileUri);
}
