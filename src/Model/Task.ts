import { TaskStatus } from "./TaskStatus";
import "crypto";
import { DateTime } from "luxon";

export class Task {
  public status: TaskStatus;
  public summary: string;
  public date: Date;

  constructor(
    status: TaskStatus,
    summary: string,
    date: Date
  ) {
    this.status = status;
    this.summary = summary;
    this.date = date;
  }

  public getId(): string {
    return crypto.randomUUID();
  }

  public getDateTimeStamp(): string {
    return DateTime.fromJSDate(this.date).toFormat("yyyyLLdd'T'HHmmss");
  }

  public getDateStart(): string {
    return DateTime.fromJSDate(this.date).toFormat("yyyyLLdd");

  }

  public getSummary(): string {
    const summary = this.summary
      .replace(/\\/gm, "\\\\")
      .replace(/\r?\n/gm, "\\n")
      .replace(/;/gm, "\\;")
      .replace(/,/gm, "\\,");

    return (this.status === TaskStatus.ToDo ? '🔲' : '✅') + ' ' + summary;
  }
}

export function createTaskFromLine(line: string): Task|null {
  const taskRegExp = /(\*|-)\s*\[(?<taskStatus>\s|x)?\]\s*(?<summary>.*)\s*/gi;
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
  const taskStatus = taskMatch?.groups?.taskStatus === 'x' ? TaskStatus.Done : TaskStatus.ToDo;
  const summary = taskMatch?.groups?.summary?.replace(dateRegExp, '').trim() ?? '';
  const year = parseInt(dateMatch?.groups?.year ?? '', 10);
  const monthIndex = parseInt(dateMatch?.groups?.month ?? '', 10) - 1;
  const day = parseInt(dateMatch?.groups?.day ?? '', 10);
  const date = new Date(year, monthIndex, day);

  return new Task(taskStatus, summary, date);
}
