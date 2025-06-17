import { 
  Settings, 
  DEFAULT_SETTINGS, 
  HOW_TO_PARSE_INTERNAL_LINKS,
  INCLUDE_EVENTS_OR_TODOS,
  HOW_TO_PROCESS_MULTIPLE_DATES
} from '../Model/Settings';

describe('Settings', () => {
  describe('DEFAULT_SETTINGS', () => {
    it('should have all required properties', () => {
      expect(DEFAULT_SETTINGS).toHaveProperty('githubPersonalAccessToken');
      expect(DEFAULT_SETTINGS).toHaveProperty('githubGistId');
      expect(DEFAULT_SETTINGS).toHaveProperty('githubUsername');
      expect(DEFAULT_SETTINGS).toHaveProperty('filename');
      expect(DEFAULT_SETTINGS).toHaveProperty('isPeriodicSaveEnabled');
      expect(DEFAULT_SETTINGS).toHaveProperty('periodicSaveInterval');
      expect(DEFAULT_SETTINGS).toHaveProperty('isSaveToGistEnabled');
      expect(DEFAULT_SETTINGS).toHaveProperty('isSaveToFileEnabled');
      expect(DEFAULT_SETTINGS).toHaveProperty('isSaveToWebEnabled');
      expect(DEFAULT_SETTINGS).toHaveProperty('savePath');
      expect(DEFAULT_SETTINGS).toHaveProperty('saveFileName');
      expect(DEFAULT_SETTINGS).toHaveProperty('saveFileExtension');
      expect(DEFAULT_SETTINGS).toHaveProperty('howToParseInternalLinks');
      expect(DEFAULT_SETTINGS).toHaveProperty('ignoreCompletedTasks');
      expect(DEFAULT_SETTINGS).toHaveProperty('isDebug');
      expect(DEFAULT_SETTINGS).toHaveProperty('includeEventsOrTodos');
      expect(DEFAULT_SETTINGS).toHaveProperty('isOnlyTasksWithoutDatesAreTodos');
      expect(DEFAULT_SETTINGS).toHaveProperty('ignoreOldTasks');
      expect(DEFAULT_SETTINGS).toHaveProperty('oldTaskInDays');
      expect(DEFAULT_SETTINGS).toHaveProperty('howToProcessMultipleDates');
      expect(DEFAULT_SETTINGS).toHaveProperty('isDayPlannerPluginFormatEnabled');
      expect(DEFAULT_SETTINGS).toHaveProperty('isIncludeTasksWithTags');
      expect(DEFAULT_SETTINGS).toHaveProperty('includeTasksWithTags');
      expect(DEFAULT_SETTINGS).toHaveProperty('isExcludeTasksWithTags');
      expect(DEFAULT_SETTINGS).toHaveProperty('excludeTasksWithTags');
      expect(DEFAULT_SETTINGS).toHaveProperty('rootPath');
      expect(DEFAULT_SETTINGS).toHaveProperty('isIncludeLinkInDescription');
      expect(DEFAULT_SETTINGS).toHaveProperty('secretKey');
    });

    it('should have sensible default values', () => {
      expect(DEFAULT_SETTINGS.filename).toBe('obsidian.ics');
      expect(DEFAULT_SETTINGS.isPeriodicSaveEnabled).toBe(true);
      expect(DEFAULT_SETTINGS.periodicSaveInterval).toBe(5);
      expect(DEFAULT_SETTINGS.isSaveToGistEnabled).toBe(false);
      expect(DEFAULT_SETTINGS.isSaveToFileEnabled).toBe(false);
      expect(DEFAULT_SETTINGS.isSaveToWebEnabled).toBe(false);
      expect(DEFAULT_SETTINGS.saveFileExtension).toBe('.ical');
      expect(DEFAULT_SETTINGS.ignoreCompletedTasks).toBe(false);
      expect(DEFAULT_SETTINGS.isDebug).toBe(false);
      expect(DEFAULT_SETTINGS.includeEventsOrTodos).toBe('EventsOnly');
      expect(DEFAULT_SETTINGS.isOnlyTasksWithoutDatesAreTodos).toBe(true);
      expect(DEFAULT_SETTINGS.ignoreOldTasks).toBe(false);
      expect(DEFAULT_SETTINGS.oldTaskInDays).toBe(365);
      expect(DEFAULT_SETTINGS.howToProcessMultipleDates).toBe('PreferDueDate');
      expect(DEFAULT_SETTINGS.isDayPlannerPluginFormatEnabled).toBe(false);
      expect(DEFAULT_SETTINGS.isIncludeTasksWithTags).toBe(false);
      expect(DEFAULT_SETTINGS.includeTasksWithTags).toBe('#calendar');
      expect(DEFAULT_SETTINGS.isExcludeTasksWithTags).toBe(false);
      expect(DEFAULT_SETTINGS.excludeTasksWithTags).toBe('#ignore');
      expect(DEFAULT_SETTINGS.rootPath).toBe('/');
      expect(DEFAULT_SETTINGS.isIncludeLinkInDescription).toBe(false);
    });

    it('should have empty strings for sensitive data by default', () => {
      expect(DEFAULT_SETTINGS.githubPersonalAccessToken).toBe('');
      expect(DEFAULT_SETTINGS.githubGistId).toBe('');
      expect(DEFAULT_SETTINGS.githubUsername).toBe('');
      expect(DEFAULT_SETTINGS.secretKey).toBe('');
    });
  });

  describe('HOW_TO_PARSE_INTERNAL_LINKS', () => {
    it('should have all expected options', () => {
      expect(HOW_TO_PARSE_INTERNAL_LINKS.DoNotModifyThem).toBe('Do not modify them (default)');
      expect(HOW_TO_PARSE_INTERNAL_LINKS.KeepTitle).toBe('Keep the title');
      expect(HOW_TO_PARSE_INTERNAL_LINKS.PreferTitle).toBe('Prefer the title');
      expect(HOW_TO_PARSE_INTERNAL_LINKS.RemoveThem).toBe('Remove them');
    });

    it('should match default setting', () => {
      expect(DEFAULT_SETTINGS.howToParseInternalLinks).toBe('DoNotModifyThem');
    });
  });

  describe('INCLUDE_EVENTS_OR_TODOS', () => {
    it('should have all expected options', () => {
      expect(INCLUDE_EVENTS_OR_TODOS.EventsOnly).toBe('Events only');
      expect(INCLUDE_EVENTS_OR_TODOS.EventsAndTodos).toBe('Events and TODO items');
      expect(INCLUDE_EVENTS_OR_TODOS.TodosOnly).toBe('TODO items only');
    });

    it('should match default setting', () => {
      expect(DEFAULT_SETTINGS.includeEventsOrTodos).toBe('EventsOnly');
    });
  });

  describe('HOW_TO_PROCESS_MULTIPLE_DATES', () => {
    it('should have all expected options', () => {
      expect(HOW_TO_PROCESS_MULTIPLE_DATES.PreferDueDate).toBe('Prefer due date (default)');
      expect(HOW_TO_PROCESS_MULTIPLE_DATES.PreferStartDate).toBe('Prefer start date');
      expect(HOW_TO_PROCESS_MULTIPLE_DATES.CreateMultipleEvents).toBe('Create an event per start/scheduled/due date');
    });

    it('should match default setting', () => {
      expect(DEFAULT_SETTINGS.howToProcessMultipleDates).toBe('PreferDueDate');
    });
  });

  describe('Settings interface validation', () => {
    it('should allow valid settings object', () => {
      const validSettings: Settings = {
        ...DEFAULT_SETTINGS,
        filename: 'custom.ics',
        isPeriodicSaveEnabled: false,
        periodicSaveInterval: 10
      };

      expect(validSettings.filename).toBe('custom.ics');
      expect(validSettings.isPeriodicSaveEnabled).toBe(false);
      expect(validSettings.periodicSaveInterval).toBe(10);
    });

    it('should maintain type safety for enum-like fields', () => {
      const settings: Settings = {
        ...DEFAULT_SETTINGS,
        howToParseInternalLinks: 'KeepTitle',
        includeEventsOrTodos: 'TodosOnly',
        howToProcessMultipleDates: 'CreateMultipleEvents'
      };

      expect(settings.howToParseInternalLinks).toBe('KeepTitle');
      expect(settings.includeEventsOrTodos).toBe('TodosOnly');
      expect(settings.howToProcessMultipleDates).toBe('CreateMultipleEvents');
    });
  });
});