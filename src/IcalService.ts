import { Task } from './Model/Task';
import { TaskDateName } from './Model/TaskDate';

export class IcalService {
  getCalendar(tasks: Task[]): string {
    const events = this.getEvents(tasks);

    let calendar = '' +
      'BEGIN:VCALENDAR\r\n' +
      'VERSION:2.0\r\n' +
      'PRODID:-//Andrew Brereton//obsidian-ical-plugin v1.10.3//EN\r\n' +
      'X-WR-CALNAME:Obsidian Calendar\r\n' +
      'NAME:Obsidian Calendar\r\n' +
      'CALSCALE:GREGORIAN\r\n' +
      events +
      'END:VCALENDAR\r\n'
      ;

    calendar = this.pretty(calendar);

    return calendar;
  }

  private getEvents(tasks: Task[]): string {
    return tasks
      .map((task: Task) => {
        return this.getEvent(task);
      })
      .join('');
  }

  private getEvent(task: Task): string {
    // console.log({task});
    let event = '' +
      'BEGIN:VEVENT\r\n' +
      'UID:' + task.getId() + '\r\n' +
      'DTSTAMP:' + task.getDate(null, 'YYYYMMDDTHHmmss') + '\r\n';

    if (task.hasA(TaskDateName.Start) && task.hasA(TaskDateName.Due)) {
      event += '' +
        'DTSTART:' + task.getDate(TaskDateName.Start, 'YYYYMMDDTHHmmss') + '\r\n' +
        'DTEND:' + task.getDate(TaskDateName.Due, 'YYYYMMDDTHHmmss') + '\r\n';
    } else if (task.hasA(TaskDateName.Start)) {
      event += '' +
        'DTSTART:' + task.getDate(TaskDateName.Start, 'YYYYMMDD') + '\r\n';
    } else if (task.hasA(TaskDateName.Due)) {
      event += '' +
        'DTSTART:' + task.getDate(TaskDateName.Due, 'YYYYMMDD') + '\r\n';
    } else {
      event += '' +
        'DTSTART:' + task.getDate(null, 'YYYYMMDD') + '\r\n';
    }

    event += '' +
      'SUMMARY:' + task.getSummary() + '\r\n' +
      'LOCATION:ALTREP="' + encodeURI(task.getLocation()) + '":' + encodeURI(task.getLocation()) + '\r\n' +
      'END:VEVENT\r\n';

    return event;
  }

  private pretty(calendar: string): string {
    // Replace two or more /r or /n or /r/n with a single CRLF
    calendar = calendar.replace('/\R{2,}/', '\r\n');

    // Ensure all line endings are CRLF. Have to do 'BSR_ANYCRLF' so we don't break emojis
    calendar = calendar.replace('~(*BSR_ANYCRLF)\R~', '\r\n');

    // Line length should not be longer than 75 characters (https://icalendar.org/iCalendar-RFC-5545/3-1-content-lines.html)
    //#TODO I can't be bothered implementing this *should* requirement

    // Ensure we are UTF-8
    calendar = Buffer.from(calendar, 'utf8').toString('utf8');

    return calendar;
  }
}
