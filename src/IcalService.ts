import { moment } from 'obsidian';
import { Task } from './Model/Task';
import { TaskDateName } from './Model/TaskDate';
import { TaskStatus } from './Model/TaskStatus';
import { settings } from './SettingsManager';
import { escapeICalText } from './iCalText';

export class IcalService {
  getCalendar(tasks: Task[]): string {

    const includeEvents = settings.includeEventsOrTodos === 'EventsAndTodos' || settings.includeEventsOrTodos === 'EventsOnly';
    const includeTodos = settings.includeEventsOrTodos === 'EventsAndTodos' || settings.includeEventsOrTodos === 'TodosOnly';

    const events = includeEvents ? this.getEvents(tasks) : '';
    const toDos = includeTodos ? this.getToDos(tasks) : '';

    const calendar = '' +
      'BEGIN:VCALENDAR\r\n' +
      'VERSION:2.0\r\n' +
      'PRODID:-//Andrew Brereton//obsidian-ical-plugin v2.5.1//EN\r\n' +
      'X-WR-CALNAME:Obsidian Calendar\r\n' +
      'NAME:Obsidian Calendar\r\n' +
      'CALSCALE:GREGORIAN\r\n' +
      events +
      toDos +
      'END:VCALENDAR\r\n'
      ;

    return calendar;
  }

  private getEvents(tasks: Task[]): string {
    return tasks
      .map((task: Task) => {
        return this.getEvent(task, null, '');
      })
      .join('');
  }

  // taskDateName is set only when CreateMultipleEvents splits this task into one
  // VEVENT per date; it discriminates the UIDs so the components don't collide.
  private getEvent(task: Task, date: string|null, prependSummary: string, taskDateName: TaskDateName|null = null): string {
    // console.log({task});

    // This task does not have a date.
    // Therefore it must be included because it is a TODO and includeEventsOrTodos setting is configured to include them.
    // Don't add it to the VEVENT block, as it will be added to the VTODO block later.
    if (task.hasAnyDate() === false) {
      return '';
    }

    let event = '' +
      'BEGIN:VEVENT\r\n' +
      'UID:' + task.getId(taskDateName ?? '') + '\r\n' +
      'DTSTAMP:' + task.getDate(null, 'YYYYMMDDTHHmmss') + '\r\n';

    const allDayPrefix = settings.isAllDayFormattingEnabled ? 'DTSTART;VALUE=DATE:' : 'DTSTART:';

    if (date === null) {

      switch (settings.howToProcessMultipleDates) {

        // User would prefer to use the task's start date
        // If a start date does not exist, take the due date
        // If a due date does not exist, take any old date that we can find
        case 'PreferStartDate':
          // An inline time range anchors to the task's date, so prefer it over an all-day emit.
          if (task.hasA(TaskDateName.TimeStart) && task.hasA(TaskDateName.TimeEnd)) {
            event += 'DTSTART:' + task.getDate(TaskDateName.TimeStart, 'YYYYMMDD[T]HHmmss') + '\r\n';
            event += 'DTEND:' + task.getDate(TaskDateName.TimeEnd, 'YYYYMMDD[T]HHmmss') + '\r\n';
          } else if (task.hasA(TaskDateName.Start)) {
            event += allDayPrefix + task.getDate(TaskDateName.Start, 'YYYYMMDD') + '\r\n';
          } else if (task.hasA(TaskDateName.Due)) {
            event += allDayPrefix + task.getDate(TaskDateName.Due, 'YYYYMMDD') + '\r\n';
          } else {
            event += allDayPrefix + task.getDate(null, 'YYYYMMDD') + '\r\n';
          }

          break;

        // User would prefer to create an event per task date
        // If there is a start date, then create an event for it
        // If there is a schedule date, then create an event for it
        // If there is a due date, then create an event for it
        // If there are no events, then take any old date that we can find
        case 'CreateMultipleEvents':
          // An inline or Day Planner time range pins the task to a specific moment,
          // so emit a single timed event instead of splitting into per-date all-day
          // entries. Matches the short-circuit in PreferStartDate / PreferDueDate.
          if (task.hasA(TaskDateName.TimeStart) && task.hasA(TaskDateName.TimeEnd)) {
            event += 'DTSTART:' + task.getDate(TaskDateName.TimeStart, 'YYYYMMDD[T]HHmmss') + '\r\n';
            event += 'DTEND:' + task.getDate(TaskDateName.TimeEnd, 'YYYYMMDD[T]HHmmss') + '\r\n';
            break;
          }

          event = '';

          if (task.hasA(TaskDateName.Start)) {
            event += this.getEvent(task, task.getDate(TaskDateName.Start, 'YYYYMMDD'), '🛫 ', TaskDateName.Start);
          }

          if (task.hasA(TaskDateName.Scheduled)) {
            event += this.getEvent(task, task.getDate(TaskDateName.Scheduled, 'YYYYMMDD'), '⏳ ', TaskDateName.Scheduled);
          }

          if (task.hasA(TaskDateName.Due)) {
            event += this.getEvent(task, task.getDate(TaskDateName.Due, 'YYYYMMDD'), '📅 ', TaskDateName.Due);
          }

          if (task.hasA(TaskDateName.Done)) {
            event += this.getEvent(task, task.getDate(TaskDateName.Done, 'YYYYMMDD'), '✅ ', TaskDateName.Done);
          }

          if (event === '') {
            event += this.getEvent(task, task.getDate(null, 'YYYYMMDD'), '');
          }

          return event;

        // User would prefer to use the task's due date
        // If there is a start and due date, set the start to the start date and the end to the due date
        // If a start and due date does not exist, take the due date
        // If a due date does not exist, take the start date
        // If a start date does not exist, take any old date that we can find
        case 'PreferDueDate':
        default:
          // An inline time range anchors to the task's date, so prefer it over an all-day emit.
          if (task.hasA(TaskDateName.TimeStart) && task.hasA(TaskDateName.TimeEnd)) {
            event += 'DTSTART:' + task.getDate(TaskDateName.TimeStart, 'YYYYMMDD[T]HHmmss') + '\r\n';
            event += 'DTEND:' + task.getDate(TaskDateName.TimeEnd, 'YYYYMMDD[T]HHmmss') + '\r\n';
          } else if (task.hasA(TaskDateName.Start) && task.hasA(TaskDateName.Due)) {
            if (settings.isAllDayFormattingEnabled) {
              // All-day ranges use an exclusive DTEND per RFC 5545, so the
              // due date itself needs to be included by pushing DTEND one
              // day past it.
              const dueRaw = task.dates.find((d) => d.name === TaskDateName.Due)!.date;
              const dueEndStr = moment(dueRaw).add(1, 'day').format('YYYYMMDD');
              event += '' +
                'DTSTART;VALUE=DATE:' + task.getDate(TaskDateName.Start, 'YYYYMMDD') + '\r\n' +
                'DTEND;VALUE=DATE:' + dueEndStr + '\r\n';
            } else {
              event += '' +
                'DTSTART:' + task.getDate(TaskDateName.Start, 'YYYYMMDDTHHmmss') + '\r\n' +
                'DTEND:' + task.getDate(TaskDateName.Due, 'YYYYMMDDTHHmmss') + '\r\n';
            }
          } else if (task.hasA(TaskDateName.Due)) {
            event += '' +
              allDayPrefix + task.getDate(TaskDateName.Due, 'YYYYMMDD') + '\r\n';
          } else if (task.hasA(TaskDateName.Start)) {
            event += '' +
              allDayPrefix + task.getDate(TaskDateName.Start, 'YYYYMMDD') + '\r\n';
          } else {
            event += '' +
              allDayPrefix + task.getDate(null, 'YYYYMMDD') + '\r\n';
          }

          break;
      }
    } else {
      // Date has been given to this function which means we are being called recursively due to CreateMultipleEvents
      event += '' +
        allDayPrefix + date + '\r\n';
    }

    // task.getLocation() is already percent-encoded at construction time in
    // TaskFinder (via encodeURIComponent on the vault name and file path).
    // Applying encodeURI here would re-encode the % signs, producing %25E2
    // where the source had %E2 — broken obsidian:// links in calendar apps.
    // ALTREP lives inside DQUOTE (URI rules, no TEXT escaping). The LOCATION
    // value after ':' IS iCal TEXT and gets the comma/semicolon escape.
    const location = task.getLocation();

    event += '' +
      'SUMMARY:' + prependSummary + task.getSummary() + '\r\n' +
      (settings.isIncludeLinkInDescription ? 'DESCRIPTION:' + escapeICalText(location) + '\r\n' : '') +
      (settings.isIncludeLocation ? 'LOCATION;ALTREP="' + location + '":' + escapeICalText(location) + '\r\n' : '') +
      'END:VEVENT\r\n';

    return event;
  }

  private getToDos(tasks: Task[]): string {
    return tasks
      .map((task: Task) => {
        if (settings.isOnlyTasksWithoutDatesAreTodos && task.hasAnyDate() === true) {
          // User only wants tasks without dates to be added as TODO items
          return '';
        }

        return this.getToDo(task);
      })
      .join('');
  }

  private getToDo(task: Task): string {
    // See getEvent() — task.getLocation() is already percent-encoded by
    // TaskFinder; re-encoding here would double-encode % signs.
    const location = task.getLocation();

    let toDo = '' +
      'BEGIN:VTODO\r\n' +
      // A dated task can also be emitted as a VEVENT, so its VTODO needs a
      // distinct UID. An undated task never produces a VEVENT (getEvent bails
      // on hasAnyDate), so leave those UIDs alone rather than churn them.
      'UID:' + task.getId(task.hasAnyDate() ? 'VTODO' : '') + '\r\n' +
      'SUMMARY:' + task.getSummary() + '\r\n' +
      // If a task does not have a date, do not include the DTSTAMP property
      (task.hasAnyDate() ? 'DTSTAMP:' + task.getDate(null, 'YYYYMMDDTHHmmss') + '\r\n' : '') +
      (settings.isIncludeLocation ? 'LOCATION;ALTREP="' + location + '":' + escapeICalText(location) + '\r\n' : '');

    if (task.hasA(TaskDateName.Due)) {
      toDo += 'DUE;VALUE=DATE:' + task.getDate(TaskDateName.Due, 'YYYYMMDD') + '\r\n';
    }

    if (task.hasA(TaskDateName.Done)) {
      toDo += 'COMPLETED;VALUE=DATE:' + task.getDate(TaskDateName.Done, 'YYYYMMDD') + '\r\n';
    }

    switch (task.status) {
      case TaskStatus.ToDo:
        toDo += 'STATUS:NEEDS-ACTION\r\n';
        break;
      case TaskStatus.InProgress:
        toDo += 'STATUS:IN-PROCESS\r\n';
        break;
      case TaskStatus.Done:
        toDo += 'STATUS:COMPLETED\r\n';
        break;
      case TaskStatus.Cancelled:
        toDo += 'STATUS:CANCELLED\r\n';
        break;
    }


    if (settings.isIncludeLinkInDescription) {
      toDo += 'DESCRIPTION:' + escapeICalText(location) + '\r\n';
    }

    toDo += 'END:VTODO\r\n';

    return toDo;
  }

}
