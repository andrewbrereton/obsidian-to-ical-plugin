import {
  App,
  ButtonComponent,
  DropdownComponent,
  normalizePath,
  PluginSettingTab,
  Setting,
  TextComponent,
  TFolder,
  ToggleComponent
} from 'obsidian';
import * as path from 'path';
import { DEFAULT_SETTINGS, HOW_TO_PARSE_INTERNAL_LINKS, HOW_TO_PROCESS_MULTIPLE_DATES, INCLUDE_EVENTS_OR_TODOS } from 'src/Model/Settings';
import { log } from './Logger';
import ObsidianIcalPlugin from './ObsidianIcalPlugin';
import { settings } from './SettingsManager';
import {apiClient} from "./ApiClient";

export class SettingTab extends PluginSettingTab {
  plugin: ObsidianIcalPlugin;
  isSecretKeyValid: boolean = false;
  calendarUrl: string | null = null;
  subscriptionStatus: string | null = null;
  subscriptionExpiresAt: string | null = null;
  calendarUpdatedAt: string | null = null;

  constructor(app: App, plugin: ObsidianIcalPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // This function returns all of the directories in the current vault
  async getAllDirectories(): Promise<string[]> {
    const files = this.app.vault.getAllLoadedFiles();
    const directories = files
        .filter((file) => file instanceof TFolder)
        .map((folder) => folder.path)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    return directories;
  }

  private clearMemberStatus(): void {
    this.isSecretKeyValid = false;
    this.subscriptionStatus = null;
    this.subscriptionExpiresAt = null;
    this.calendarUrl = null;
    this.calendarUpdatedAt = null;
  }

  private updateMemberStatusFromCache(): void {
    if (!settings.secretKey || settings.secretKey.length !== 32) {
      this.clearMemberStatus();
      return;
    }

    const client = apiClient(this.app.vault.getName(), settings.secretKey);
    const cachedValidation = client.getCachedValidation();

    if (cachedValidation) {
      this.isSecretKeyValid = cachedValidation.isSubscriptionActive();
      this.subscriptionStatus = cachedValidation.status;
      this.subscriptionExpiresAt = cachedValidation.expiresAt?.toISOString() || null;

      // Get calendar info
      client.getCalendar().then(calendarResponse => {
        if (calendarResponse.found) {
          this.calendarUrl = calendarResponse.url;
          this.calendarUpdatedAt = calendarResponse.updatedAt;
        }
      }).catch(() => {
        // Ignore calendar fetch errors
      });
    } else {
      // No cache yet - trigger background validation for valid-looking secret key
      this.validateSecretKeyInBackground(settings.secretKey);
    }
  }

  private async validateSecretKeyInBackground(secretKey: string): Promise<void> {
    if (secretKey.length !== 32) {
      this.clearMemberStatus();
      return;
    }

    try {
      const client = apiClient(this.app.vault.getName(), secretKey);
      const response = await client.isActive(true); // Force fresh validation
      
      if (response.isSubscriptionActive()) {
        // Valid - update UI and configure refresh
        this.updateMemberStatusFromCache();
        await this.plugin.configureValidationRefresh();
        this.display(); // Refresh UI to show member status
      } else {
        this.clearMemberStatus();
      }
    } catch (error) {
      log('Background secret key validation failed:', error);
      this.clearMemberStatus();
    }
  }

  private async validateSecretKey(secretKey: string): Promise<void> {
    if (secretKey.length !== 32) {
      return; // Invalid length, don't validate
    }

    try {
      const client = apiClient(this.app.vault.getName(), secretKey);
      client.clearValidationCache(); // Clear old cache

      const response = await client.isActive(true); // Force fresh validation

      if (response.isSubscriptionActive()) {
        // Valid - cache will be automatically populated by isActive call
        this.updateMemberStatusFromCache();
        await this.plugin.configureValidationRefresh();
      }
    } catch (error) {
      log('Secret key validation failed:', error);
      // Leave member status cleared
    }
  }


  async display(): Promise<void> {
    const { containerEl } = this;

    containerEl.empty();

    // Update member status from cache
    this.updateMemberStatusFromCache();

    containerEl.createEl('p', {
      text: createFragment((fragment) => {
        fragment.append('This plugin finds all of the ');
        fragment.append(fragment.createEl('a', {
          text: 'Task Lists',
          title: 'Link to Task Lists on on obsidian.md (https://help.obsidian.md/syntax#Task+lists)',
          href: 'https://help.obsidian.md/syntax#Task+lists',
          cls: 'search-result und',
        }));
        fragment.append(' in your vault that contain a date and generates a calendar in iCalendar format. Your calendar can be saved and imported into your preferred calendar application.');
      })
    });

    containerEl.createEl('h2', { text: 'Quick Start & Essential Settings' });

    const directories = await this.getAllDirectories();

    new Setting(containerEl)
      .setName('Target directory')
      .setDesc('Specify where we should look for tasks. Choose "/" to look in the whole vault.')
      .addDropdown((dropdown: DropdownComponent) => {
        directories.forEach((dir) => {
          dropdown.addOption(dir, dir);
        });

        dropdown
          .onChange(async (value) => {
            value = normalizePath(value);
            settings.rootPath = value;
          });

          return dropdown;
        }
      );

    containerEl.createEl('h3', { text: 'Save Destinations' });

    new Setting(containerEl)
      .setName('Save calendar to disk?')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(settings.isSaveToFileEnabled)
          .onChange(async (value) => {
            settings.isSaveToFileEnabled = value;
            this.display();
          })
      );

    new Setting(containerEl)
      .setName('Save calendar to GitHub Gist?')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(settings.isSaveToGistEnabled)
          .onChange(async (value) => {
            settings.isSaveToGistEnabled = value;
            this.display();
          })
      );

    containerEl.createEl('h3', { text: 'Member Area' });
    containerEl.createEl('p', {
      cls: 'setting-item-description',
      text: createFragment((fragment) => {
        fragment.append('Optionally, you can become a member to unlock more features such as calendar hosting. ');
        fragment.append(fragment.createEl('a', {
          text: 'Create an account on obsidian-ical.com',
          href: 'https://obsidian-ical.com/',
          cls: 'search-result',
        }));
      })
    });

    new Setting(containerEl)
      .setName('Secret Key')
      .setDesc(createFragment((fragment) => {
        fragment.append('Copy and paste your ');
        fragment.append(fragment.createEl('a', {
          text: 'Secret Key',
          href: 'https://obsidian-ical.com/member/secret-key',
          cls: 'search-result',
        }));
        fragment.append(' here to unlock member features');
      }))
      .addText((text) =>
        text
          .setValue(settings.secretKey.toString())
          .setPlaceholder(DEFAULT_SETTINGS.secretKey)
          .onChange(async (secretKey) => {
            settings.secretKey = secretKey;
            
            // Clear member status when key changes
            this.clearMemberStatus();
            
            // Only validate if exactly 32 characters
            if (secretKey.length === 32) {
              await this.validateSecretKey(secretKey);
              this.display();
            }
          })
      );

    // Secret Key is active so show member status and pro settings
    if (this.isSecretKeyValid) {
      // Member Status Section
      containerEl.createEl('h4', { text: 'Member Status', cls: 'setting-item-name' });

      // Subscription Status
      const subscriptionStatusText = this.subscriptionStatus === 'active' ? '✅ Active' :
                                   this.subscriptionStatus === 'trialing' ? '🆓 Trial' :
                                   `⚠️ ${this.subscriptionStatus}`;

      new Setting(containerEl)
        .setName('Subscription')
        .setDesc(createFragment((fragment) => {
          fragment.createEl('span', { text: subscriptionStatusText });
          if (this.subscriptionExpiresAt) {
            const expiryDate = new Date(this.subscriptionExpiresAt);
            fragment.createEl('br');
            fragment.createEl('small', {
              text: `Renews: ${expiryDate.toLocaleDateString()}`,
              cls: 'setting-item-description'
            });
          }
        }));

      // Calendar Status and URL
      if (this.calendarUrl) {
        new Setting(containerEl)
          .setName('Calendar URL')
          .setDesc(createFragment((fragment) => {
            fragment.createEl('a', {
              text: this.calendarUrl!,
              href: this.calendarUrl!,
              cls: 'search-result'
            });
            if (this.calendarUpdatedAt) {
              const updatedDate = new Date(this.calendarUpdatedAt);
              fragment.createEl('br');
              fragment.createEl('small', {
                text: `Last updated: ${updatedDate.toLocaleString()}`,
                cls: 'setting-item-description'
              });
            }
          }))
          .addButton((button: ButtonComponent) => {
            button
              .setButtonText('📋 Copy to clipboard')
              .onClick(() => {
                navigator.clipboard.writeText(this.calendarUrl!);
                button.setButtonText('✅ Copied!');
                window.setTimeout(() => {
                  button.setButtonText('📋 Copy to clipboard');
                }, 500);
              });
          });
      } else {
        containerEl.createEl('p', {
          cls: 'setting-item-description',
          text: '📅 Your calendar URL will appear here after your first save to the web.'
        });
      }

      containerEl.createEl('h4', { text: 'Pro Settings', cls: 'setting-item-name' });

      new Setting(containerEl)
        .setName('Save calendar to the web')
        .setDesc('Turning this on will save your calendar to your private area on https://obsidian-ical.com')
        .addToggle((toggle: ToggleComponent) =>
          toggle
            .setValue(settings.isSaveToWebEnabled)
            .onChange(async (value) => {
              settings.isSaveToWebEnabled = value;
              await this.plugin.configureValidationRefresh();
              this.display();
            })
        );
    }

    containerEl.createEl('h2', { text: 'Task Processing' });

    new Setting(containerEl)
      .setName('Ignore completed tasks?')
      .setDesc('Choose if you want your calendar to ignore tasks that have been completed.')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(settings.ignoreCompletedTasks)
          .onChange(async (value) => {
            settings.ignoreCompletedTasks = value;
            this.display();
          })
      );

    new Setting(containerEl)
      .setName('Add tasks as TODO items to your calendar')
      .setDesc('Normally, we add your tasks as normal calendar events. You can choose to add your tasks as TODO items as well. Or you could add your tasks as calendar events as well as TODO items.')
      .addDropdown((dropdown: DropdownComponent) =>
        dropdown
          .addOptions(INCLUDE_EVENTS_OR_TODOS)
          .setValue(settings.includeEventsOrTodos)
          .onChange(async (value) => {
            settings.includeEventsOrTodos = value;
            this.display();
          })
      );

    if (settings.includeEventsOrTodos === 'EventsAndTodos' || settings.includeEventsOrTodos === 'TodosOnly') {
      new Setting(containerEl)
        .setName('Only tasks without dates are TODO items')
        .setDesc('When adding the TODO items to your calendar, should we only consider tasks without dates as TODO items?')
        .addToggle((toggle: ToggleComponent) =>
          toggle
            .setValue(settings.isOnlyTasksWithoutDatesAreTodos)
            .onChange(async (value) => {
              settings.isOnlyTasksWithoutDatesAreTodos = value;
              this.display();
            })
        );
    }

    new Setting(containerEl)
      .setName('Ignore old tasks?')
      .setDesc('Do you want to exclude tasks if they are older than a certain age? This could be useful if you have a very large number of tasks and are not interested in the past.')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(settings.ignoreOldTasks)
          .onChange(async (value) => {
            settings.ignoreOldTasks = value;
            this.display();
          })
      );

    if (settings.ignoreOldTasks) {
      new Setting(containerEl)
        .setName('How many days back to you want to keep old tasks?')
        .setDesc('If every date for a given task is more than this many days ago then it will be excluded from your calendar.')
        .addText((text) =>
          text
            .setValue(settings.oldTaskInDays.toString())
            .onChange(async (value) => {
              let days: number = parseInt(value, 10);
              if (days < 0) days = 1;
              if (days > 3650) days = 3650;
              settings.oldTaskInDays = days;
            })
        );
    }

    new Setting(containerEl)
      .setName('Which task date should be used?')
      .setDesc('A task can have many dates (eg: due, start, scheduled, etc). When multiple dates are encountered in a task, which date do you want to use for the calendar?')
      .addDropdown((dropdown: DropdownComponent) =>
        dropdown
          .addOptions(HOW_TO_PROCESS_MULTIPLE_DATES)
          .setValue(settings.howToProcessMultipleDates)
          .onChange(async (value) => {
            settings.howToProcessMultipleDates = value;
            this.display();
          })
      );

    new Setting(containerEl)
      .setName('Support Day Planner plugin?')
      .setDesc('Turn this on if you want to support the Day Planner plugin format.')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(settings.isDayPlannerPluginFormatEnabled)
          .onChange(async (value) => {
            settings.isDayPlannerPluginFormatEnabled = value;
            this.display();
          })
      );

    new Setting(containerEl)
      .setName('Save calendar to GitHub Gist?')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(settings.isSaveToGistEnabled)
          .onChange(async (value) => {
            settings.isSaveToGistEnabled = value;
            this.display();
          })
      );

    new Setting(containerEl)
      .setName('Save calendar to disk?')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(settings.isSaveToFileEnabled)
          .onChange(async (value) => {
            settings.isSaveToFileEnabled = value;
            this.display();
          })
      );

    new Setting(containerEl)
      .setName('Periodically save your calendar')
      .setDesc('Do you want the plugin to periodically process your tasks? If you choose not to then a calendar will only be built when Obsidian is loaded.')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(settings.isPeriodicSaveEnabled)
          .onChange(async (value) => {
            settings.isPeriodicSaveEnabled = value;
            this.plugin.configurePeriodicSave();
            this.display();
          })
      );

    if (settings.isPeriodicSaveEnabled) {
      new Setting(containerEl)
        .setName('How often should we parse and save your calendar? (minutes)')
        .setDesc('How often do you want to periodically scan for tasks?')
        .addText((text) =>
          text
            .setValue(settings.periodicSaveInterval.toString())
            .onChange(async (value) => {
              let minutes: number = parseInt(value, 10);
              if (minutes < 1) minutes = 1;
              if (minutes > 1440) minutes = 1440;
              settings.periodicSaveInterval = minutes;
              await this.plugin.configurePeriodicSave();
            })
        );
    }

    new Setting(containerEl)
      .setName('Only include tasks with certain tags?')
      .setDesc('Do you want your calendar to only include tasks that contain certain tags?')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(settings.isIncludeTasksWithTags)
          .onChange(async (value) => {
            settings.isIncludeTasksWithTags = value;
            this.display();
          })
      );

    if (settings.isIncludeTasksWithTags) {
      new Setting(containerEl)
        .setName('Only include tasks that contain these tags')
        .setDesc('Enter one or more tags. Separate multiple tags with a space. If one or more of these tags are found then the task will be included in your calendar.')
        .addText((text) =>
          text
            .setValue(settings.includeTasksWithTags.toString())
            .setPlaceholder(DEFAULT_SETTINGS.includeTasksWithTags)
            .onChange(async (includeTasksWithTags) => {
              includeTasksWithTags = this.cleanTags(includeTasksWithTags);
              settings.includeTasksWithTags = includeTasksWithTags;
            })
        );
    }

    new Setting(containerEl)
      .setName('Exclude tasks with certain tags?')
      .setDesc('Do you want your calendar to exclude tasks that contain certain tags?')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(settings.isExcludeTasksWithTags)
          .onChange(async (value) => {
            settings.isExcludeTasksWithTags = value;
            this.display();
          })
      );

    if (settings.isExcludeTasksWithTags) {
      new Setting(containerEl)
        .setName('Exclude tasks that contain these tags')
        .setDesc('Enter one or more tags. Separate multiple tags with a space. If one or more of these tags are found then the task will be excluded from your calendar.')
        .addText((text) =>
          text
            .setValue(settings.excludeTasksWithTags.toString())
            .setPlaceholder(DEFAULT_SETTINGS.excludeTasksWithTags)
            .onChange(async (excludeTasksWithTags) => {
              excludeTasksWithTags = this.cleanTags(excludeTasksWithTags);
              settings.excludeTasksWithTags = excludeTasksWithTags;
            })
        );
    }

    containerEl.createEl('h2', { text: 'Automation & Advanced' });

    new Setting(containerEl)
      .setName('Periodically save your calendar')
      .setDesc('Do you want the plugin to periodically process your tasks? If you choose not to then a calendar will only be built when Obsidian is loaded.')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(settings.isPeriodicSaveEnabled)
          .onChange(async (value) => {
            settings.isPeriodicSaveEnabled = value;
            this.plugin.configurePeriodicSave();
            this.display();
          })
      );

    if (settings.isPeriodicSaveEnabled) {
      new Setting(containerEl)
        .setName('How often should we parse and save your calendar? (minutes)')
        .setDesc('How often do you want to periodically scan for tasks?')
        .addText((text) =>
          text
            .setValue(settings.periodicSaveInterval.toString())
            .onChange(async (value) => {
              let minutes: number = parseInt(value, 10);
              if (minutes < 1) minutes = 1;
              if (minutes > 1440) minutes = 1440;
              settings.periodicSaveInterval = minutes;
              await this.plugin.configurePeriodicSave();
            })
        );
    }

    new Setting(containerEl)
      .setName('Processing internal links')
      .setDesc('How should [[wikilinks]] and [markdown links](markdown links) be processed if they are encountered in a task?')
      .addDropdown((dropdown: DropdownComponent) =>
        dropdown
          .addOptions(HOW_TO_PARSE_INTERNAL_LINKS)
          .setValue(settings.howToParseInternalLinks)
          .onChange(async (value) => {
            settings.howToParseInternalLinks = value;
            this.display();
          })
      );

    new Setting(containerEl)
      .setName('Add link to Obsidian in event description')
      .setDesc('Include a link to open the task in Obsidian in the event description. This is useful for clients such as Thunderbird or Evolution.')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(settings.isIncludeLinkInDescription)
          .onChange(async (value) => {
            settings.isIncludeLinkInDescription = value;
            this.display();
          })
      );

    containerEl.createEl('h2', { text: 'Save Destinations' });

    if (settings.isSaveToGistEnabled) {
      containerEl.createEl('h3', { text: 'GitHub Gist Settings' });

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
            .setValue(settings.githubPersonalAccessToken)
            .onChange(async (value: string) => {
              try {
                this.validateGithubPersonalAccessToken(value);
                githubPersonalAccessTokenErrorElement.innerText = '';
                settings.githubPersonalAccessToken = value;
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
            .setValue(settings.githubGistId)
            .onChange(async (value) => {
              settings.githubGistId = value;
            })
        );

      new Setting(containerEl)
        .setName('GitHub username')
        .setDesc('This is only used to generate the URL to your calendar')
        .addText((text: TextComponent) =>
          text
            .setValue(settings.githubUsername)
            .onChange(async (value) => {
              settings.githubUsername = value;
            })
        );

      new Setting(containerEl)
        .setName('Filename')
        .setDesc('Give your calendar a file name')
        .addText((text: TextComponent) =>
          text
            .setValue(settings.filename)
            .setPlaceholder('obsidian.ics')
            .onChange(async (value) => {
              settings.filename = value;
            })
        );

      const url = `https://gist.githubusercontent.com/${settings.githubUsername}/${settings.githubGistId}/raw/${settings.filename}`;

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

    if (settings.isSaveToFileEnabled) {
      containerEl.createEl('h3', { text: 'Local File Settings' });

      if (settings.saveFileName === DEFAULT_SETTINGS.saveFileName) {
        settings.saveFileName = this.app.vault.getName();
        this.display();
      }

      new Setting(containerEl)
        .setName('Path')
        .setDesc('Which directory/folder do you want to save your calendar to? An empty string means to the current vault root path. The path must be inside the vault.')
        .addText((text: TextComponent) =>
          text
            .setValue(settings.savePath)
            .onChange(async (value) => {
              settings.savePath = value;
            })
        );

      new Setting(containerEl)
        .setName('Filename')
        .setDesc('What do you want to call the file of your calendar? An empty string means ' + this.app.vault.getName())
        .addText((text: TextComponent) =>
          text
            .setPlaceholder(this.app.vault.getName())
            .setValue(settings.saveFileName ?? this.app.vault.getName())
            .onChange(async (value) => {
              settings.saveFileName = value;
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
            .setValue(settings.saveFileExtension)
            .onChange(async (value) => {
              settings.saveFileExtension = value;
              this.display();
            })
        );

      const savePath = `${settings.savePath ?? settings.savePath + path.sep}${settings.saveFileName}${settings.saveFileExtension}`;

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
    }

    containerEl.createEl('h2', { text: 'Troubleshooting' });

    new Setting(containerEl)
      .setName('Debug mode')
      .setDesc('Turning this on will write logs to console.')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(settings.isDebug)
          .onChange(async (value) => {
            settings.isDebug = value;
            this.display();
          })
      );
  }

  validateGithubPersonalAccessToken(value: string): void {
    const githubClassicPersonalAccessTokenRegex = /^ghp_[a-zA-Z0-9]{36}$/;
    const githubFineGrainedPersonalAccessTokenRegex = /^github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}$/;

    if (new RegExp(githubClassicPersonalAccessTokenRegex).test(value) || new RegExp(githubFineGrainedPersonalAccessTokenRegex).test(value)) {
      return;
    }

    throw new Error('GitHub Personal Access Token must start in "ghp_" for classic tokens or "github_pat_" for fine-grained tokens.');
  }

  // Replace multiple whitespace characters with a single space
  cleanTags(value: string): string {
    return value.replace(/\s+/g, ' ');
  }
}
