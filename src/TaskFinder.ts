import { Task } from "./Model/Task";
import { TaskStatus } from "./Model/TaskStatus";

export class TaskFinder {
  private tasks: Task[];
  private taskRegExp = /^\s*(\*|-)\s*\[(?<taskStatus>\s|x)?\]\s*(?<summary>.*)$/gim;
  private dateRegExp = /\b(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\b/gim;

  constructor() {
    this.tasks = [];
  }

  findTasks(markdown: string): Task[] {
    return [...markdown.matchAll(this.taskRegExp)]
      .filter((taskMatch) => {
        // Skip the tasks that don't have a date
        return new RegExp(this.dateRegExp).test(taskMatch?.groups?.summary ?? '');
      })
      .map((taskMatch) => {
        return this.createTask(taskMatch);
      });
  }

  private createTask(match: RegExpMatchArray): Task {
    const taskStatus = match?.groups?.taskStatus === 'x' ? TaskStatus.Done : TaskStatus.ToDo;
    const summary = match?.groups?.summary ?? '';
    const dateMatch = [...summary.matchAll(this.dateRegExp)][0]; // If there are multiple dates, just get the first one
    const date = new Date(dateMatch?.groups?.year, parseInt(dateMatch?.groups?.month, 10) - 1, dateMatch?.groups?.day);

    return new Task(taskStatus, summary, date);
  }
}