import {
  App,
  ButtonComponent,
  DropdownComponent,
  PluginSettingTab,
  Setting,
  TextComponent,
  ToggleComponent
} from 'obsidian';
import * as path from 'path';
import { SETTINGS, DEFAULT_SETTINGS, HOW_TO_PARSE_INTERNAL_LINKS, HOW_TO_PROCESS_MULTIPLE_DATES } from 'src/Model/Settings';
import { log } from './Logger';
import ObsidianIcalPlugin from './ObsidianIcalPlugin';
import { getSetting, setSetting } from './SettingsManager';

export class SettingTab extends PluginSettingTab {
  plugin: ObsidianIcalPlugin;

  constructor(app: App, plugin: ObsidianIcalPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async display(): Promise<void> {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('p', { cls: 'setting-item-description', text: 'This plugin finds all of the tasks in your vault that contain a date and generates a calendar in iCalendar format. The calendar can be saved to a file and/or saved in a Gist on GitHub so that it can be added to your iCalendar calendar of choice.' });

    new Setting(containerEl)
      .setName('Processing internal links')
      .setDesc('How should [[wikilinks]] and [markdown links](markdown links) be processed if they are encountered in a task?')
      .addDropdown((dropdown: DropdownComponent) =>
        dropdown
          .addOptions(HOW_TO_PARSE_INTERNAL_LINKS)
          .setValue(getSetting(SETTINGS.howToParseInternalLinks))
          .onChange(async (value) => {
            await setSetting(SETTINGS.howToParseInternalLinks, value);
            this.display();
          })
      );

    new Setting(containerEl)
      .setName('Ignore completed tasks?')
      .setDesc('Choose if you want your calendar to ignore tasks that have been completed.')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(getSetting(SETTINGS.ignoreCompletedTasks))
          .onChange(async (value) => {
            await setSetting(SETTINGS.ignoreCompletedTasks, value);
            this.display();
          })
      );

    new Setting(containerEl)
      .setName('Ignore old tasks?')
      .setDesc('Do you want to exclude tasks if they are older than a certain age? This could be useful if you have a very large number of tasks and are not interested in the past.')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(getSetting(SETTINGS.ignoreOldTasks))
          .onChange(async (value) => {
            await setSetting(SETTINGS.ignoreOldTasks, value);
            this.display();
          })
      );

    if (getSetting(SETTINGS.ignoreOldTasks)) {
      new Setting(containerEl)
        .setName('How many days back to you want to keep old tasks?')
        .setDesc('If every date for a given task is more than this many days ago then it will be excluded from your calendar.')
        .addText((text) =>
          text
            .setValue(getSetting(SETTINGS.oldTaskInDays).toString())
            .onChange(async (value) => {
              let days: number = parseInt(value, 10);
              if (days < 0) days = 1;
              if (days > 3650) days = 3650;
              await setSetting(SETTINGS.oldTaskInDays, days);
            })
        );
    }

    new Setting(containerEl)
      .setName('Which task date should be used?')
      .setDesc('A task can have many dates (eg: due, start, scheduled, etc). When multiple dates are encountered in a task, which date do you want to use for the calendar?')
      .addDropdown((dropdown: DropdownComponent) =>
        dropdown
          .addOptions(HOW_TO_PROCESS_MULTIPLE_DATES)
          .setValue(getSetting(SETTINGS.howToProcessMultipleDates))
          .onChange(async (value) => {
            await setSetting(SETTINGS.howToProcessMultipleDates, value);
            this.display();
          })
      );

    new Setting(containerEl)
      .setName('Save calendar to GitHub Gist?')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(getSetting(SETTINGS.isSaveToGistEnabled))
          .onChange(async (value) => {
            await setSetting(SETTINGS.isSaveToGistEnabled, value);
            this.display();
          })
      );

    new Setting(containerEl)
      .setName('Save calendar to disk?')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(getSetting(SETTINGS.isSaveToFileEnabled))
          .onChange(async (value) => {
            await setSetting(SETTINGS.isSaveToFileEnabled, value);
            this.display();
          })
      );

    new Setting(containerEl)
      .setName('Periodically save your calendar')
      .setDesc('Do you want the plugin to periodically process your tasks? If you choose not to then a calendar will only be built when Obsidian is loaded.')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(getSetting(SETTINGS.isPeriodicSaveEnabled))
          .onChange(async (value) => {
            await setSetting(SETTINGS.isPeriodicSaveEnabled, value);
            this.plugin.configurePeriodicSave();
            this.display();
          })
      );

    if (getSetting(SETTINGS.isPeriodicSaveEnabled)) {
      new Setting(containerEl)
        .setName('How often should we parse and save your calendar? (minutes)')
        .setDesc('How often do you want to periodically scan for tasks?')
        .addText((text) =>
          text
            .setValue(getSetting(SETTINGS.periodicSaveInterval).toString())
            .onChange(async (value) => {
              let minutes: number = parseInt(value, 10);
              if (minutes < 1) minutes = 1;
              if (minutes > 1440) minutes = 1440;
              await setSetting(SETTINGS.periodicSaveInterval, minutes);
              this.plugin.configurePeriodicSave();
            })
        );
    }

    if (getSetting(SETTINGS.isSaveToGistEnabled)) {
      containerEl.createEl('h1', { text: 'Save calendar to GitHub Gist' });

      containerEl.createEl('p', { cls: 'setting-item-description', text: 'Perform the following steps to get your Personal Access Token and Gist ID:' });
      const ol = containerEl.createEl('ol');
      ol.createEl('li', { cls: 'setting-item-description', text: 'Go to https://github.com/settings/tokens/new and create a new personal access token. It only needs Gist scope.' });
      ol.createEl('li', { cls: 'setting-item-description', text: 'Go to https://gist.github.com/ and create a new secret Gist.' });
      containerEl.append(ol);

      new Setting(containerEl)
        .setName('GitHub personal access token')
        .setDesc('Used to privately store your calendar on Github')
        .addText((text: TextComponent) =>
          text
            .setValue(getSetting(SETTINGS.githubPersonalAccessToken))
            .onChange(async (value: string) => {
              try {
                this.validateGithubPersonalAccessToken(value);
                githubPersonalAccessTokenErrorElement.innerText = '';
                await setSetting(SETTINGS.githubPersonalAccessToken, value);
              } catch(error) {
                log('Error!', error);
                githubPersonalAccessTokenErrorElement.innerText = `${error.message ?? 'Unknown error'}`;
              }
            })
        );
      const githubPersonalAccessTokenErrorElement = containerEl.createEl('p', { text: '', cls: ['setting-message', 'cm-negative'] });
      containerEl.append(githubPersonalAccessTokenErrorElement);

      new Setting(containerEl)
        .setName('GitHub Gist ID')
        .setDesc('This is the unique ID to the Gist that you created in GitHub')
        .addText((text: TextComponent) =>
          text
            // .setPlaceholder("Enter your GitHub Gist ID")
            .setValue(getSetting(SETTINGS.githubGistId))
            .onChange(async (value) => {
                await setSetting(SETTINGS.githubGistId, value);
            })
        );

      new Setting(containerEl)
        .setName('GitHub username')
        .setDesc('This is only used to generate the URL to your calendar')
        .addText((text: TextComponent) =>
          text
            .setValue(getSetting(SETTINGS.githubUsername))
            .onChange(async (value) => {
              await setSetting(SETTINGS.githubUsername, value);
            })
        );

      new Setting(containerEl)
        .setName('Filename')
        .setDesc('Give your calendar a file name')
        .addText((text: TextComponent) =>
          text
            .setValue(getSetting(SETTINGS.filename))
            .setPlaceholder('obsidian.ics')
            .onChange(async (value) => {
              await setSetting(SETTINGS.filename, value);
            })
        );

      const url = `https://gist.githubusercontent.com/${getSetting(SETTINGS.githubUsername)}/${getSetting(SETTINGS.githubGistId)}/raw/${getSetting(SETTINGS.filename)}`;

      new Setting(containerEl)
        .setName('Your calendar URL')
      // eslint-disable-next-line no-undef
        .setDesc(createFragment((fragment) => {
          fragment.createEl('a', { text: url, href: url, cls: 'search-result'});
        }))
        .addButton((button: ButtonComponent) => {
          button
            .setButtonText('📋 Copy to clipboard')
            .onClick(() => {
              navigator.clipboard.writeText(url);
              button.setButtonText('✅ Copied!');
              window.setTimeout(() => {
                button.setButtonText('📋 Copy to clipboard');
              }, 500);
            });
        });
    }


    if (getSetting(SETTINGS.isSaveToFileEnabled)) {
      containerEl.createEl('h1', { text: 'Save calendar to disk' });

      if (getSetting(SETTINGS.saveFileName) === DEFAULT_SETTINGS.saveFileName) {
        await setSetting(SETTINGS.saveFileName, this.app.vault.getName());
        this.display();
      }

      new Setting(containerEl)
        .setName('Path')
        .setDesc('Which directory/folder do you want to save your calendar to? An empty string means to the current vault root path. The path must be inside the vault.')
        .addText((text: TextComponent) =>
          text
            .setValue(getSetting(SETTINGS.savePath))
            .onChange(async (value) => {
              await setSetting(SETTINGS.savePath, value);
            })
        );

      new Setting(containerEl)
        .setName('Filename')
        .setDesc('What do you want to call the file of your calendar? An empty string means ' + this.app.vault.getName())
        .addText((text: TextComponent) =>
          text
            .setPlaceholder(this.app.vault.getName())
            .setValue(getSetting(SETTINGS.saveFileName) ?? this.app.vault.getName())
            .onChange(async (value) => {
              await setSetting(SETTINGS.saveFileName, value);
            })
        );

      new Setting(containerEl)
        .setName('File extension')
        .setDesc('The file extension must be one of .ical or .ics or .ifb or .icalendar')
        .addDropdown((dropdown: DropdownComponent) =>
          dropdown
            .addOptions({
              '.ics': '.ics',
              '.ical': '.ical',
              '.ifb': '.ifb',
              '.icalendar': '.icalendar',
            })
            .setValue(getSetting(SETTINGS.saveFileExtension))
            .onChange(async (value) => {
              await setSetting(SETTINGS.saveFileExtension, value);
              this.display();
            })
        );

      const savePath = `${getSetting(SETTINGS.savePath) ?? getSetting(SETTINGS.savePath) + path.sep}${getSetting(SETTINGS.saveFileName)}${getSetting(SETTINGS.saveFileExtension)}`;

      new Setting(containerEl)
        .setName('Your calendar path')
      // eslint-disable-next-line no-undef
        .setDesc(createFragment((fragment) => {
          fragment.createEl('a', { text: savePath, href: `file:///${savePath}`, cls: 'search-result'});
        }))
        .addButton((button: ButtonComponent) => {
          button
            .setButtonText('📋 Copy to clipboard')
            .onClick(() => {
              navigator.clipboard.writeText(savePath);
              button.setButtonText('✅ Copied!');
              window.setTimeout(() => {
                button.setButtonText('📋 Copy to clipboard');
              }, 500);
            });
        });

      new Setting(containerEl)
        .setName('Debug mode')
        .setDesc('Turning this on will write logs to console.')
        .addToggle((toggle: ToggleComponent) =>
          toggle
            .setValue(getSetting(SETTINGS.isDebug))
            .onChange(async (value) => {
              await setSetting(SETTINGS.isDebug, value);
              this.display();
            })
        );
    }
  }

  validateGithubPersonalAccessToken(value: string): void {
    const githubClassicPersonalAccessTokenRegex = /^ghp_[a-zA-Z0-9]{36}$/;
    const githubFineGrainedPersonalAccessTokenRegex = /^github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}$/;

    if (new RegExp(githubClassicPersonalAccessTokenRegex).test(value) || new RegExp(githubFineGrainedPersonalAccessTokenRegex).test(value)) {
      return;
    }

    throw new Error('GitHub Personal Access Token must start in "ghp_" for classic tokens or "github_pat_" for fine-grained tokens.');
  }
}
