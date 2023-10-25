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
