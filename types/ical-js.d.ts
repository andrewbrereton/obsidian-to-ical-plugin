declare module 'ical.js' {
  export function parse(input: string): jCal
  export function stringify(jCal: jCal): string

  export type jCal = ['vcalendar', Headers[], Event[]]

  export type Headers = [
    'calscale' | 'prodid' | 'version',
    Record<string, unknown>,
    'text',
    string,
  ]

  export type Event = ['vevent', EventBody[], []]

  export type EventBody = [
    'dtstamp' | 'dtstart' | 'summary' | 'uid',
    Record<string, unknown>,
    'date-time' | 'date' | 'text',
    string,
  ]
}
