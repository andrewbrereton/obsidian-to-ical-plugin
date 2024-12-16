import { expect, test, describe, beforeAll, afterAll } from 'bun:test'
import * as ICAL from 'ical.js'
import { jCal } from 'ical.js'
import * as fs from 'fs/promises'
import * as path from 'path'

const OFFSET_HOURS = 3 // for UTC+ 3

describe('Obsidian iCal Plugin', () => {
  let jcalData: jCal
  const taskIds: number[] = []

  const getEvent = (id: number) =>
    jcalData[2].find((event) =>
      event[1].some(
        (prop) => prop[0] === 'summary' && prop[3].includes(`id=${id},`)
      )
    )

  beforeAll(async () => {
    const outputPath = path.join('test', 'obsidian-ical-plugin.ics')
    const icsContent = await fs.readFile(outputPath, 'utf-8')
    jcalData = ICAL.parse(icsContent)

    for (let i = 21; i <= 128; i++) {
      taskIds.push(i)
    }
  })

  test('iCalendar file structure', () => {
    expect(jcalData[0]).toBe('vcalendar')

    const prodid = jcalData[1].find((prop) => prop[0] === 'prodid')?.[3]
    const versionRegex =
      /-\/\/Andrew Brereton\/\/obsidian-ical-plugin v(\d+\.\d+\.\d+)/
    expect(prodid).toMatch(versionRegex)

    expect(jcalData[1]).toContainEqual(['version', {}, 'text', '2.0'])
  })

  test('All tasks are present in the iCalendar file', () => {
    // Ensure taskIds is populated before running this test
    expect(taskIds.length).toBeGreaterThan(0) // Sanity check to ensure taskIds is not empty

    const taskPresence = taskIds.map((id) => Boolean(getEvent(id)))

    // Check if every task ID has a corresponding event
    const allTasksPresent = taskPresence.every(
      (isPresent) => isPresent === true
    )
    expect(allTasksPresent).toBe(true)
  })

  describe('Check specific task details', () => {
    const testCases = [
      { id: 21, expectedSummaryIncludes: 'todo, bare date' },
      { id: 22, expectedSummaryIncludes: '✅' },
      { id: 23, expectedSummaryIncludes: '🚫' },
      { id: 24, expectedSummaryIncludes: '🏃' },
      { id: 25, expectedSummaryIncludes: '🔲' },
      { id: 27, expectedSummaryIncludes: '#tag' },
      { id: 29, expectedSummaryIncludes: 'wikilink link bare' },
      { id: 33, expectedSummaryIncludes: 'wikilink title' },
      { id: 37, expectedSummaryIncludes: 'markdown title' },
      { id: 47, expectedSummaryIncludes: 'cancelled,' },
      { id: 71, expectedSummaryIncludes: 'wikilink link bare' },
      { id: 77, expectedSummaryIncludes: 'markdown title' },
      { id: 88, expectedSummaryIncludes: 'in progress' },
      { id: 124, expectedSummaryIncludes: 'in progress' },
      { id: 127, expectedSummaryIncludes: 'cancelled' },
    ]

    testCases.forEach(({ id, expectedSummaryIncludes }) => {
      test(`Task id=${id} summary includes "${expectedSummaryIncludes}"`, () => {
        const event = getEvent(id)
        expect(event).toBeDefined()

        const summary = event?.[1].find((prop) => prop[0] === 'summary')?.[3]
        expect(summary).toContain(expectedSummaryIncludes)
      })
    })
  })

  describe('Date formatting for tasks with dates', () => {
    const testCases = [
      21, 23, 44, 48, 56, 67, 73, 79, 80, 85, 91, 92, 101, 104, 105, 120, 129,
      130, 131, 132, 133, 134, 135, 136,
    ]
    const expectedDate = '20240101' // Expected date format without time
    testCases.forEach((id) => {
      test(`Date formatting for tasks with dates (id=${id})`, () => {
        const event = getEvent(id)
        expect(event).toBeDefined()

        const summary = event?.[1].find((prop) => prop[0] === 'summary')
        expect(summary).toBeDefined()

        const dtstart = event?.[1].find((prop) => prop[0] === 'dtstart')?.[3]
        const dateOnly = dtstart?.split('T')[0].replace(/-/g, '') // Extracts date part and formats to 'YYYYMMDD'
        expect(dateOnly).toBe(expectedDate) // Compares date part only
      })
    })
  })

  describe('TODO items were added', () => {
    const testCases = [
      { id: 1, expectedSummaryIncludes: 'no dates' },
      { id: 2, expectedSummaryIncludes: 'no dates' },
      { id: 3, expectedSummaryIncludes: 'no dates' },
      { id: 4, expectedSummaryIncludes: 'no dates' },
      { id: 5, expectedSummaryIncludes: 'no dates' },
      { id: 6, expectedSummaryIncludes: 'no dates' },
      { id: 7, expectedSummaryIncludes: 'no dates' },
      { id: 8, expectedSummaryIncludes: 'no dates' },
      { id: 9, expectedSummaryIncludes: 'no dates' },
    ]

    testCases.forEach(({ id, expectedSummaryIncludes }) => {
      test(`Task id=${id} summary includes "${expectedSummaryIncludes}"`, () => {
        const event = getEvent(id)
        expect(event).toBeDefined()

        const summary = event?.[1].find((prop) => prop[0] === 'summary')?.[3]
        expect(summary).toContain(expectedSummaryIncludes)
      })
    })
  })

  describe('Day Planner format working', () => {
    // UTC timezone
    const testCases = [
      { id: 129, expectedStartTime: '17:01', expectedEndTime: '17:31' },
      { id: 130, expectedStartTime: '17:02', expectedEndTime: '17:32' },
      { id: 131, expectedStartTime: '17:00', expectedEndTime: '17:30' },
      { id: 132, expectedStartTime: '17:03', expectedEndTime: '17:33' },
      { id: 133, expectedStartTime: '17:04', expectedEndTime: '17:34' },
      { id: 134, expectedStartTime: '17:00', expectedEndTime: '17:30' },
      { id: 135, expectedStartTime: '17:03', expectedEndTime: '17:33' },
      { id: 136, expectedStartTime: '17:04', expectedEndTime: '17:34' },

      { id: 137, expectedStartTime: '17:05', expectedEndTime: '17:06' },
      { id: 138, expectedStartTime: '17:06', expectedEndTime: '17:07' },
      { id: 139, expectedStartTime: '17:00', expectedEndTime: '18:00' },
      { id: 140, expectedStartTime: '17:07', expectedEndTime: '17:08' },
      { id: 141, expectedStartTime: '17:08', expectedEndTime: '17:09' },
      { id: 142, expectedStartTime: '17:00', expectedEndTime: '18:00' },
      { id: 143, expectedStartTime: '17:09', expectedEndTime: '17:10' },
      { id: 144, expectedStartTime: '17:10', expectedEndTime: '17:11' },

      { id: 145, expectedStartTime: '17:11', expectedEndTime: '17:12' },
      { id: 146, expectedStartTime: '17:12', expectedEndTime: '17:13' },
      { id: 147, expectedStartTime: '17:00', expectedEndTime: '18:00' },
      { id: 148, expectedStartTime: '17:13', expectedEndTime: '17:14' },
      { id: 149, expectedStartTime: '17:14', expectedEndTime: '17:15' },
      { id: 150, expectedStartTime: '17:00', expectedEndTime: '18:00' },
      { id: 151, expectedStartTime: '17:15', expectedEndTime: '17:16' },
      { id: 152, expectedStartTime: '17:16', expectedEndTime: '17:17' },
    ]

    testCases.forEach(({ id, expectedStartTime, expectedEndTime }) => {
      test(`Task id=${id} has start time "${expectedStartTime}"`, () => {
        const event = getEvent(id)
        expect(event).toBeDefined()

        const dtstart = event?.[1].find((prop) => prop[0] === 'dtstart')?.[3]
        expect(dtstart).toBeDefined()
        if (!dtstart) return

        const dtstartLocaltime = convertUtcToLocalTimeString(dtstart)

        expect(dtstartLocaltime).toContain(expectedStartTime)
      })

      test(`Task id=${id} has end time "${expectedEndTime}"`, () => {
        const event = getEvent(id)
        expect(event).toBeDefined()

        const dtend = event?.[1].find((prop) => prop[0] === 'dtend')?.[3]
        expect(dtend).toBeDefined()
        if (!dtend) return

        const dtendLocaltime = convertUtcToLocalTimeString(dtend)
        expect(dtendLocaltime).toContain(expectedEndTime)
      })
    })
  })

  describe('Excluded tasks were excluded', () => {
    // 160-163 for Task and Day planner
    const testCases = [156, 157, 158, 159, 160, 161, 162, 163]
    testCases.forEach((id) => {
      test(`Task should be excluded (id=${id})`, () => {
        const event = getEvent(id)
        expect(event).toBeUndefined()
      })
    })
  })

  describe('Tasks and Day Planner without time', () => {
    const testCases = [164, 165, 166, 167, 168, 169, 170, 171]
    testCases.forEach((id) => {
      test(`Task should be included (id=${id})`, () => {
        const event = getEvent(id)
        const dateAndTime = event?.[1].find(
          (prop) => prop[2] === 'date-time'
        )?.[3]
        const timeOnly = dateAndTime?.split('T')[1]
        expect(timeOnly).toBe('00:00:00')
      })
    })
  })

  describe('Tasks and Day Planner with time', () => {
    const testCases = [
      { id: 172, timeStart: '17:01', timeEnd: '17:31', date: '2025-01-01' },
      { id: 173, timeStart: '17:05', timeEnd: '17:06', date: '2025-01-01' },
      { id: 174, timeStart: '17:00', timeEnd: '17:30', date: '2025-01-01' },
      { id: 175, timeStart: '17:00', timeEnd: '18:00', date: '2025-01-01' },
    ]

    testCases.forEach(({ id, timeStart, timeEnd, date }) => {
      test(`Task id=${id} has start time "${timeStart}"`, () => {
        const event = getEvent(id)
        expect(event).toBeDefined()

        const dtstart = event?.[1].find((prop) => prop[0] === 'dtstart')?.[3]
        expect(dtstart).toBeDefined()
        if (!dtstart) return

        const dtstartLocaltime = convertUtcToLocalTimeString(dtstart)

        expect(dtstartLocaltime).toContain(timeStart)

        const dtend = event?.[1].find((prop) => prop[0] === 'dtend')?.[3]
        expect(dtend).toBeDefined()
        if (!dtend) return

        const dtendLocaltime = convertUtcToLocalTimeString(dtend)
        expect(dtendLocaltime).toContain(timeEnd)

        const dateOnly = dtstart?.split('T')[0]
        expect(dateOnly).toBe(date)
      })
    })
  })

  afterAll(async () => {
    // Cleanup: delete the generated .ics file, if necessary
    // await fs.unlink(outputPath);
  })
})

function convertUtcToLocalTimeString(utcString: string) {
  // Convert the string to a more standard ISO 8601 format for parsing
  const isoString = utcString.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
    '$1-$2-$3T$4:$5:$6Z'
  )

  // Parse the ISO string as UTC, then convert to local Date object
  const date = new Date(isoString)
  date.setHours(date.getHours() + OFFSET_HOURS)

  // Format the date to "HH:MM" string
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${hours}:${minutes}`
}
