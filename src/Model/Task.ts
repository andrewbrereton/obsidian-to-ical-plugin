import 'crypto';
import { moment } from 'obsidian';
import { TaskDate, TaskDateName, getTaskDatesFromMarkdown, hasTime } from './TaskDate';
import { TaskStatus, getTaskStatusEmoji, getTaskStatusFromMarkdown } from './TaskStatus';
import { getSummaryFromMarkdown } from './TaskSummary';
import { settings } from '../SettingsManager';

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

    if (typeof matchingTaskDate === 'undefined') {
      return '';
    }

    // If the Task has its time set, then it has been set because we are have found a Day Planner plugin
    // task. The time is in local timezone, so we need to convert it to UTC.
    if (hasTime(matchingTaskDate)) {
      return moment(matchingTaskDate.date).utc().format(format);
    } else {
      return moment(matchingTaskDate.date).format(format);
    }
  }

  public getTimeFromSummary() {
    const timeRegex = /(\d{1,2}(?::\d{2}(?::\d{2})?)?\s*[aApP][mM]?)\s*-\s*(\d{1,2}(?::\d{2}(?::\d{2})?)?\s*[aApP][mM]?)/;
    const singleTimeRegex = /(\d{1,2}(?::\d{2}(?::\d{2})?)?\s*[aApP][mM]?)/;
    
    const to24HourFormat = (time) => {
        let [fullTime, ampm] = time.split(/([aApP][mM])/);
        ampm = ampm ? ampm.toLowerCase() : '';
        let [hours, minutes, seconds] = fullTime.split(':').map(Number);
        
        if (ampm.includes('p') && hours !== 12) {
            hours += 12;
        } else if (ampm.includes('a') && hours === 12) {
            hours = 0;
        }

        hours = String(hours).padStart(2, '0');
        minutes = String(minutes || 0).padStart(2, '0');
        seconds = String(seconds || 0).padStart(2, '0');
        
        return `${hours}:${minutes}:${seconds}`;
    };

    let match = this.summary.match(timeRegex);
    if (!match) {
        match = this.summary.match(singleTimeRegex);
        if (match) {
            match = [match[0], match[1], match[1]];
        }
    }
    
    if (match) {
        let start = to24HourFormat(match[1].trim());
        let end = to24HourFormat(match[2].trim());

        // 如果 start 和 end 相同，将 end 往后推半小时
        if (start === end) {
            const [hours, minutes, seconds] = start.split(':').map(Number);
            const endDate = new Date();
            endDate.setHours(hours, minutes, seconds || 0);
            endDate.setMinutes(endDate.getMinutes() + 30);

            const endHours = String(endDate.getHours()).padStart(2, '0');
            const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
            const endSeconds = String(endDate.getSeconds()).padStart(2, '0');
            end = `${endHours}:${endMinutes}:${endSeconds}`;
        }

        // 格式化为 hhmmss
        const formatTime = (time) => {
            const [hours, minutes, seconds] = time.split(':');
            return `${hours}${minutes}${seconds}`;
        };

        return {
            start: formatTime(start),
            end: formatTime(end)
        };
    }
    return null;
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

export function createTaskFromLine(line: string, fileUri: string, dateOverride: Date|null): Task|null {
  const taskRegExp = /(\*|-)\s*(?<taskStatus>\[.?])\s*(?<summary>.*)\s*/gi;
  const dateRegExp = /\b(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\b/gi;

  const taskMatch = [...line.matchAll(taskRegExp)][0] ?? null;

  // This isn't a task. Bail.
  if (taskMatch === null) {
    return null;
  }

  const dateMatch = [...line.matchAll(dateRegExp)][0] ?? null;

  // This task doesn't have a date and we are not including TODO items. Bail.
  if ((dateMatch === null && dateOverride === null) && settings.isIncludeTodos === false) {
    return null;
  }

  // Extract the Task data points from the matches
  const taskStatus = getTaskStatusFromMarkdown(taskMatch?.groups?.taskStatus ?? '');

  // Task is done and user wants to ignore completed tasks. Bail.
  if (taskStatus === TaskStatus.Done && settings.ignoreCompletedTasks === true) {
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
