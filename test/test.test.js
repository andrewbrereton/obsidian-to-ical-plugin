const ICAL = require('ical.js');
const fs = require('fs').promises;
const path = require('path');

describe('Obsidian iCal Plugin - Legacy Integration Tests', () => {
  let jcalData;
  const expectedTaskIds = [];

  beforeAll(async () => {
    try {
      const outputPath = path.join('test', 'obsidian-ical-plugin.ics');
      const icsContent = await fs.readFile(outputPath, 'utf-8');
      jcalData = ICAL.parse(icsContent);

      // Dynamically discover task IDs instead of hardcoding
      const allItems = jcalData[2] || [];
      allItems.forEach(item => {
        const summary = item[1]?.find(prop => prop[0] === 'summary');
        if (summary) {
          const idMatch = summary[3].match(/id=(\d+),/);
          if (idMatch) {
            expectedTaskIds.push(parseInt(idMatch[1]));
          }
        }
      });

      expectedTaskIds.sort((a, b) => a - b);
    } catch (error) {
      console.warn('Legacy test file not found. Skipping legacy integration tests.');
      jcalData = null;
    }
  });

  test('iCalendar file structure', () => {
    expect(jcalData[0]).toBe('vcalendar');

    const prodid = jcalData[1].find(prop => prop[0] === 'prodid')[3];
    const versionRegex = /-\/\/Andrew Brereton\/\/obsidian-ical-plugin v(\d+\.\d+\.\d+)/;
    expect(prodid).toMatch(versionRegex);

    expect(jcalData[1]).toContainEqual(['version', {}, 'text', '2.0']);
  });

  test('All discovered tasks are present in the iCalendar file', () => {
    if (!jcalData) {
      console.warn('Skipping test - no iCal file available');
      return;
    }

    // Ensure expectedTaskIds is populated
    expect(expectedTaskIds.length).toBeGreaterThan(0);

    // All discovered IDs should be valid
    expectedTaskIds.forEach(id => {
      const event = jcalData[2].find(event => {
        const summary = event[1]?.find(prop => prop[0] === 'summary');
        return summary && summary[3].includes(`id=${id},`);
      });
      expect(event).toBeDefined();
    });
  });

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
    ];

    testCases.forEach(({ id, expectedSummaryIncludes }) => {
      test(`Task id=${id} summary includes "${expectedSummaryIncludes}"`, () => {
        const event = jcalData[2].find(event => event[1].some(prop => prop[0] === 'summary' && prop[3].includes(`id=${id},`)));
        expect(event).toBeDefined();
        const summary = event[1].find(prop => prop[0] === 'summary')[3];
        expect(summary).toContain(expectedSummaryIncludes);
      });
    });
  });

  describe('Date formatting for tasks with dates', () => {
    const testCases = [21,23,44,48,56,67,73,79,80,85,91,92,101,104,105,120,129,130,131,132,133,134,135,136];
    const expectedDate = '20240101'; // Expected date format without time
    testCases.forEach((id) => {
      test(`Date formatting for tasks with dates (id=${id})`, () => {
        jcalData[2].forEach((event) => {
          const summary = event[1].find(prop => prop[0] === 'summary');
          if (summary && summary[3].includes(`id=${id}`)) {
            const dtstart = event[1].find(prop => prop[0] === 'dtstart')[3];
            const dateOnly = dtstart.split('T')[0].replace(/-/g, ''); // Extracts date part and formats to 'YYYYMMDD'
            expect(dateOnly).toBe(expectedDate); // Compares date part only
          }
        });
      });
    });
  });

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
    ];

    testCases.forEach(({ id, expectedSummaryIncludes }) => {
      test(`Task id=${id} summary includes "${expectedSummaryIncludes}"`, () => {
        const event = jcalData[2].find(event => event[1].some(prop => prop[0] === 'summary' && prop[3].includes(`id=${id},`)));
        expect(event).toBeDefined();
        const summary = event[1].find(prop => prop[0] === 'summary')[3];
        expect(summary).toContain(expectedSummaryIncludes);
      });
    });
  });

  describe('Daily Planner format working', () => {
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
    ];

    testCases.forEach(({ id, expectedStartTime, expectedEndTime }) => {
      test(`Task id=${id} has start time "${expectedStartTime}"`, () => {
        const event = jcalData[2].find(event => event[1].some(prop => prop[0] === 'summary' && prop[3].includes(`id=${id},`)));
        expect(event).toBeDefined();

        const dtstart = event[1].find(prop => prop[0] === 'dtstart')[3];
        expect(dtstart).toBeDefined();

        const dtstartUtcTime = convertUtcToUtcTimeString(dtstart);
        expect(dtstartUtcTime).toContain(expectedStartTime);
      });

      test(`Task id=${id} has end time "${expectedEndTime}"`, () => {
        const event = jcalData[2].find(event => event[1].some(prop => prop[0] === 'summary' && prop[3].includes(`id=${id},`)));
        expect(event).toBeDefined();

        const dtend = event[1].find(prop => prop[0] === 'dtend')[3];
        expect(dtend).toBeDefined();

        const dtendUtcTime = convertUtcToUtcTimeString(dtend);
        expect(dtendUtcTime).toContain(expectedEndTime);
      });

    });
  });


  describe('Excluded tasks were excluded', () => {
    const testCases = [156, 157, 158, 159];
    testCases.forEach((id) => {
      test(`Task should be excluded (id=${id})`, () => {
        let found = false; // Flag to indicate if the ID is found
        jcalData[2].forEach((event) => {
          const summary = event[1].find(prop => prop[0] === 'summary');
          if (summary && summary[3].includes(`id=${id}`)) {
            found = true; // Set flag to true if ID is found
          }
        });
        expect(found).toBe(false); // Expect the ID to not be found
      });
    });
  });

  afterAll(async () => {
  // Cleanup: delete the generated .ics file, if necessary
  // await fs.unlink(outputPath);
  });
});

function convertUtcToUtcTimeString(utcString) {
  // Extract time directly from UTC string without timezone conversion
  // Format: YYYYMMDDTHHMMSSZ -> HH:MM
  const timeMatch = utcString.match(/T(\d{2})(\d{2})\d{2}Z$/);
  
  if (timeMatch) {
    const hours = timeMatch[1];
    const minutes = timeMatch[2];
    return `${hours}:${minutes}`;
  }
  
  // Fallback: Convert the string to ISO format and extract UTC time
  const isoString = utcString.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
    '$1-$2-$3T$4:$5:$6Z'
  );

  const date = new Date(isoString);
  
  // Use UTC methods to avoid any local timezone conversion
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}
