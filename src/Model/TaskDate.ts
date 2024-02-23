export class TaskDate {
  date: Date;
  name: TaskDateName;

  constructor(date: Date, name: TaskDateName) {
    this.date = date;
    this.name = name;
  }
}

export enum TaskDateName {
  Created = 'Created',
  Scheduled = 'Scheduled',
  Start = 'Start',
  Due = 'Due',
  Done = 'Done',
  Unknown = 'Unknown',
  TimeStart = 'TimeStart',
  TimeEnd = 'TimeEnd',
}

const TaskDateEmojiMap: Record<TaskDateName, string> = {
  [TaskDateName.Created]: '➕',
  [TaskDateName.Scheduled]: '⏳',
  [TaskDateName.Start]: '🛫',
  [TaskDateName.Due]: '📅',
  [TaskDateName.Done]: '✅',
  [TaskDateName.Unknown]: '',
  [TaskDateName.TimeStart]: '',
  [TaskDateName.TimeEnd]: '',
};

const EmojiToTaskDateNameMap: Record<string, TaskDateName> = Object.entries(TaskDateEmojiMap).reduce(
  (acc, [key, emoji]) => {
    acc[emoji] = key as TaskDateName;
    return acc;
  },
  {} as Record<string, TaskDateName>
);

// Unused. Uncomment if needed in the future
// function getEmojiFromTaskName(taskDateName: TaskDateName): string {
//   return TaskDateEmojiMap[taskDateName] || '';
// }

function getTaskNameFromEmoji(emoji: string): TaskDateName {
  return EmojiToTaskDateNameMap[emoji] ?? TaskDateName.Unknown;
}

// Fixes #42
// If dates are stored in [Dataview Format](https://publish.obsidian.md/tasks/Reference/Task+Formats/Dataview+Format)
// then let's convert it to emoji format before continuing
function convertDataviewToEmoji(markdown: string): string {
  const dataviewFormatCreated = /\[created::\s?(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\s?\]/gi;
  const dataviewFormatScheduled = /\[scheduled::\s?(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\s?\]/gi;
  const dataviewFormatStart = /\[start::\s?(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\s?\]/gi;
  const dataviewFormatDue = /\[due::\s?(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\s?\]/gi;
  const dataviewFormatDone = /\[completion::\s?(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\s?\]/gi;
  const dataviewFormatCancelled = /\[cancelled::\s?(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\s?\]/gi;

  markdown = markdown.replace(dataviewFormatCreated, (match, year, month, day) => {
    return `➕ ${year}-${month}-${day}`;
  });

  markdown = markdown.replace(dataviewFormatScheduled, (match, year, month, day) => {
    return `⏳ ${year}-${month}-${day}`;
  });

  markdown = markdown.replace(dataviewFormatStart, (match, year, month, day) => {
    return `🛫 ${year}-${month}-${day}`;
  });

  markdown = markdown.replace(dataviewFormatDue, (match, year, month, day) => {
    return `📅 ${year}-${month}-${day}`;
  });

  markdown = markdown.replace(dataviewFormatDone, (match, year, month, day) => {
    return `✅ ${year}-${month}-${day}`;
  });

  markdown = markdown.replace(dataviewFormatCancelled, (match, year, month, day) => {
    return `❌ ${year}-${month}-${day}`;
  });

  return markdown;
}

export function getTaskDatesFromMarkdown(markdown: string, dateOverride: Date|null): TaskDate[] {
  // Convert Dataview Format to Emoji Format
  markdown = convertDataviewToEmoji(markdown);

  // If we have an override date, then just use that instead of trying to derive them
  if (dateOverride !== null) {
    const timeRegExp = /\b(\d{1,2}(?::\d{2})?(?::\d{2})?\s*[ap]m|\d{1,2}(?::\d{2})?(?::\d{2})?)(?:\s*-\s*(\d{1,2}(?::\d{2})?(?::\d{2})?\s*[ap]m|\d{1,2}(?::\d{2})?(?::\d{2})?))?\b/i;
    // const timeRegExp = /\b((?<!\d{4}-\d{2}-)\d{1,2}:(\d{2})(?::\d{2})?\s*(?:[ap][m])?|(?<!\d{4}-\d{2}-)\d{1,2}\s*[ap][m])\b/gi;
    const match = markdown.match(timeRegExp);

    if (!match) {
      return [];
    }

    let timeStartString = match[1];
    let timeEndString = match[2]; // The second time, if present

    if (!timeEndString) {
      // If the second time is not present, calculate it
      timeEndString = calculateEndTime(timeStartString);
    }

    const timeStart = createTimeDate(dateOverride, timeStartString);
    const timeEnd = createTimeDate(dateOverride, timeEndString);

    return [
      new TaskDate(timeStart, TaskDateName.TimeStart),
      new TaskDate(timeEnd, TaskDateName.TimeEnd),
    ];
  }

  const dateRegExp = /(?<emoji>➕|⏳|🛫|📅|✅)?\s?(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\b/gi;
  const dateMatches = [...markdown.matchAll(dateRegExp)];

  const taskDates = dateMatches
    .filter((dateMatch) => {
      // Validate (emoji is optional)
      return  dateMatch?.groups?.day &&
        dateMatch?.groups?.month &&
        dateMatch?.groups?.year;
    })
    .map((dateMatch) => {
      // Create TaskDate
      const taskDateName = getTaskNameFromEmoji(dateMatch?.groups?.emoji ?? '');
      const year = parseInt(dateMatch?.groups?.year ?? '', 10);
      const monthIndex = parseInt(dateMatch?.groups?.month ?? '', 10) - 1;
      const day = parseInt(dateMatch?.groups?.day ?? '', 10);
      const date = new Date(year, monthIndex, day);

      return new TaskDate(date, taskDateName);
    });

  return taskDates;
}

function calculateEndTime(startTime: string): string {
  // Handle AM/PM and convert to 24-hour time for calculation if needed
  const isPM = startTime.toLowerCase().includes('pm');
  let [hour, minute] = startTime.replace(/(am|pm)/i, '').split(':').map(Number);

  if (isNaN(minute)) minute = 0; // If no minutes then set it to 0

  if (isPM && hour < 12) hour += 12; // Convert PM to 24-hour
  if (!isPM && hour === 12) hour = 0; // Handle 12 AM as 00:00

  let endMinute = minute + 30;
  let endHour = hour;

  if (endMinute >= 60) {
    endMinute -= 60;
    endHour += 1;
  }

  // Convert back to 12-hour format if needed, and adjust AM/PM
  let endAMPM = 'AM';
  if (endHour >= 12) {
    endAMPM = 'PM';
    if (endHour > 12) {
      endHour -= 12;
    }
  }

  if (endHour === 0) {
    // Midnight to 12 AM
    endHour = 12;
  }

  // Ensure two digits for minute
  const endMinuteStr = endMinute.toString().padStart(2, '0');

  return `${endHour}:${endMinuteStr} ${endAMPM}`;
}

function createTimeDate(dateOverride: Date, timeString: string): Date {
  const year = dateOverride.getFullYear();
  const month = dateOverride.getMonth();
  const day = dateOverride.getDate();

  // This regex matches hours, optional minutes, optional seconds, and optional AM/PM with various spacings
  const timeRegex = /(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*([ap]m)?/i;
  const match = timeString.match(timeRegex);

  if (!match) throw new Error('Invalid time format');

  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const second = match[3] ? parseInt(match[3], 10) : 0;
  const amPmIndicator = match[4];

  // Adjust for AM/PM
  if (amPmIndicator) {
    if (amPmIndicator.toLowerCase() === 'pm' && hour < 12) hour += 12;
    if (amPmIndicator.toLowerCase() === 'am' && hour === 12) hour = 0;
  }

  return new Date(year, month, day, hour, minute, second);
}

export function hasTime(taskDate: TaskDate): boolean {
  // Create a new Date object representing the start of the day (midnight) of the input date
  const startOfDay = new Date(taskDate.date);
  startOfDay.setHours(0, 0, 0, 0);

  // Compare the original date to the start of the day
  // If they are not equal, time has been set
  return taskDate.date.getTime() !== startOfDay.getTime();
}
