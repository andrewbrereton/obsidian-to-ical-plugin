import { TaskDate, TaskDateName } from './TaskDate'

export function parseTaskStartAndEndTime(markdown: string, dateOverride: Date) {
  const timeRegExp =
    /\b(\d{1,2}(?::\d{2})?(?::\d{2})?\s*[ap]m|\d{1,2}(?::\d{2})?(?::\d{2})?)(?:\s*-\s*(\d{1,2}(?::\d{2})?(?::\d{2})?\s*[ap]m|\d{1,2}(?::\d{2})?(?::\d{2})?))?\b/i
  // const timeRegExp = /\b((?<!\d{4}-\d{2}-)\d{1,2}:(\d{2})(?::\d{2})?\s*(?:[ap][m])?|(?<!\d{4}-\d{2}-)\d{1,2}\s*[ap][m])\b/gi;
  const match = markdown.match(timeRegExp)

  if (!match) {
    return []
  }

  const timeStartString = match[1]
  let timeEndString = match[2] // The second time, if present

  if (!timeEndString) {
    // If the second time is not present, calculate it
    timeEndString = calculateEndTime(timeStartString)
  }

  const timeStart = createTimeDate(dateOverride, timeStartString)
  const timeEnd = createTimeDate(dateOverride, timeEndString)

  return [
    new TaskDate(timeStart, TaskDateName.TimeStart),
    new TaskDate(timeEnd, TaskDateName.TimeEnd),
  ]
}

function calculateEndTime(startTime: string): string {
  // Handle AM/PM and convert to 24-hour time for calculation if needed
  const isPM = startTime.toLowerCase().includes('pm')
  let [hour, minute] = startTime
    .replace(/(am|pm)/i, '')
    .split(':')
    .map(Number)

  if (isNaN(minute)) minute = 0 // If no minutes then set it to 0

  if (isPM && hour < 12) hour += 12 // Convert PM to 24-hour
  if (!isPM && hour === 12) hour = 0 // Handle 12 AM as 00:00

  let endMinute = minute + 30
  let endHour = hour

  if (endMinute >= 60) {
    endMinute -= 60
    endHour += 1
  }

  // Convert back to 12-hour format if needed, and adjust AM/PM
  let endAMPM = 'AM'
  if (endHour >= 12) {
    endAMPM = 'PM'
    if (endHour > 12) {
      endHour -= 12
    }
  }

  if (endHour === 0) {
    // Midnight to 12 AM
    endHour = 12
  }

  // Ensure two digits for minute
  const endMinuteStr = endMinute.toString().padStart(2, '0')

  return `${endHour}:${endMinuteStr} ${endAMPM}`
}

function createTimeDate(dateOverride: Date, timeString: string): Date {
  const year = dateOverride.getFullYear()
  const month = dateOverride.getMonth()
  const day = dateOverride.getDate()

  // This regex matches hours, optional minutes, optional seconds, and optional AM/PM with various spacings
  const timeRegex = /(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*([ap]m)?/i
  const match = timeString.match(timeRegex)

  if (!match) throw new Error('Invalid time format')

  let hour = parseInt(match[1], 10)
  const minute = match[2] ? parseInt(match[2], 10) : 0
  const second = match[3] ? parseInt(match[3], 10) : 0
  const amPmIndicator = match[4]

  // Adjust for AM/PM
  if (amPmIndicator) {
    if (amPmIndicator.toLowerCase() === 'pm' && hour < 12) hour += 12
    if (amPmIndicator.toLowerCase() === 'am' && hour === 12) hour = 0
  }

  return new Date(year, month, day, hour, minute, second)
}
