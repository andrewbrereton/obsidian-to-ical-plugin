import * as crypto from 'crypto'
import { moment } from 'obsidian'

import { TaskDate, TaskDateName, hasTime } from './TaskDate'
import { TaskStatus, getTaskStatusEmoji } from './TaskStatus'

export class Task {
  public status: TaskStatus
  dates: TaskDate[]
  public summary: string
  fileUri: string

  constructor(
    status: TaskStatus,
    dates: TaskDate[],
    summary: string,
    fileUri: string
  ) {
    this.status = status
    this.dates = dates
    this.summary = summary
    this.fileUri = fileUri
  }

  public getId(): string {
    return crypto.randomUUID()
  }

  public hasA(taskDateName: TaskDateName): boolean {
    return this.dates.some((taskDate: TaskDate) => {
      return taskDate.name === taskDateName
    })
  }

  public hasAnyDate(): boolean {
    return this.dates.length > 0
  }

  public getDate(taskDateName: TaskDateName | null, format: string): string {
    // If there are not dates, then return an empty string
    // This happens when TODOs are included as they don't require a date
    if (this.dates.length === 0) {
      return ''
    }

    // HACK: If taskDateName is null then just use the first date that we know about
    if (taskDateName === null) {
      taskDateName = this.dates[0].name
    }

    const matchingTaskDate = this.dates.find((taskDate: TaskDate) => {
      if (taskDate.name === taskDateName) {
        return taskDate.date
      }
    })

    if (typeof matchingTaskDate === 'undefined') {
      return ''
    }

    // If the Task has its time set, then it has been set because we are have found a Day Planner plugin
    // task. The time is in local timezone, so we need to convert it to UTC.
    if (hasTime(matchingTaskDate)) {
      return moment(matchingTaskDate.date).utc().format(format)
    } else {
      return moment(matchingTaskDate.date).format(format)
    }
  }

  public getSummary(): string {
    const summary = this.summary
      .replace(/\\/gm, '\\\\')
      .replace(/\r?\n/gm, '\\n')
      .replace(/;/gm, '\\;')
      .replace(/,/gm, '\\,')

    const emoji = getTaskStatusEmoji(this.status)

    return `${emoji} ${summary}`
  }

  public getLocation(): string {
    return this.fileUri
  }
}
