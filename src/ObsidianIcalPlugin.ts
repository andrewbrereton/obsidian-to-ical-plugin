import { Plugin } from 'obsidian';
import { Main } from 'src/Main';
import { log, logger } from './Logger';
import { SettingTab } from './SettingTab';
import { initSettingsManager, settings } from './SettingsManager';

export default class ObsidianIcalPlugin extends Plugin {
  main: Main;
  periodicSaveInterval: number|null;
  validationRefreshInterval: number|null;

  async onload() {
    // Initialise SettingsManager
    await initSettingsManager(this);
    // Initialise Logger
    logger(settings.isDebug);

    log('SettingsManager and Logger initialised');

    // // This creates an icon in the left ribbon.
    // const ribbonIconEl = this.addRibbonIcon(
    //   "calendar-days",
    //   "Obsidian to iCal",
    //   (evt: MouseEvent) => {
    //     // Called when the user clicks the icon.
    //     new Notice("This is a notice!");
    //   }
    // );

    // // Perform additional things with the ribbon
    // ribbonIconEl.addClass("my-plugin-ribbon-class");

    // // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    // const statusBarItemEl = this.addStatusBarItem();
    // statusBarItemEl.setText("Status Bar Text");

    // // This adds a simple command that can be triggered anywhere
    // this.addCommand({
    //   id: "open-sample-modal-simple",
    //   name: "Open sample modal (simple)",
    //   callback: () => {
    //     new SampleModal(this.app).open();
    //   },
    // });
    // // This adds an editor command that can perform some operation on the current editor instance
    // this.addCommand({
    //   id: "sample-editor-command",
    //   name: "Sample editor command",
    //   editorCallback: (editor: Editor, view: MarkdownView) => {
    //     console.log(editor.getSelection());
    //     editor.replaceSelection("Sample Editor Command");
    //   },
    // });

    // // This adds a complex command that can check whether the current state of the app allows execution of the command
    // this.addCommand({
    //   id: "open-sample-modal-complex",
    //   name: "Open sample modal (complex)",
    //   checkCallback: (checking: boolean) => {
    //     // Conditions to check
    //     const markdownView =
    //       this.app.workspace.getActiveViewOfType(MarkdownView);
    //     if (markdownView) {
    //       // If checking is true, we're simply "checking" if the command can be run.
    //       // If checking is false, then we want to actually perform the operation.
    //       if (!checking) {
    //         new SampleModal(this.app).open();
    //       }

    //       // This command will only show up in Command Palette when the check function returns true
    //       return true;
    //     }
    //   },
    // });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SettingTab(this.app, this));

    // // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
    // // Using this function will automatically remove the event listener when this plugin is disabled.
    // this.registerDomEvent(document, "click", (evt: MouseEvent) => {
    //   console.log("click", evt);
    // });

    // I've run into an issue when calling Main.start() here
    // It is as though the vault is not ready because it always finds 0 Markdown files
    // Therefore, Main.start() is called during onLayoutReady to give Obsidian some time to be ready
    this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));
  }

  // Once the Obsidian layout is ready, kick off a scan and configure periodic save
  async onLayoutReady(): Promise<void> {
    this.main = new Main(this.app);
    await this.main.start();

    await this.configurePeriodicSave();
    await this.configureValidationRefresh();
  }

  onunload() {
    this.clearPeriodicSaveInterval();
    this.clearValidationRefreshInterval();
  }

  clearPeriodicSaveInterval() {
    window.clearInterval(this.periodicSaveInterval ?? 0);
    this.periodicSaveInterval = null;
  }

  clearValidationRefreshInterval() {
    window.clearInterval(this.validationRefreshInterval ?? 0);
    this.validationRefreshInterval = null;
  }

  // Trigger a save every now and then
  async configurePeriodicSave() {
    // Clear any existing period save intervals before we do anything else
    this.clearPeriodicSaveInterval();

    if (settings.isPeriodicSaveEnabled && settings.periodicSaveInterval > 0) {
      log(`Periodic save enabled and will run every ${settings.periodicSaveInterval} minute(s)`);
      this.periodicSaveInterval = window.setInterval(async () => {
        log(`Periodic save triggers every ${settings.periodicSaveInterval} minute(s)`);
        await this.main.start();
      }, settings.periodicSaveInterval * 1000 * 60);

      // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
      this.registerInterval(this.periodicSaveInterval);
    }
  }

  // Refresh validation cache every 5 minutes when web save is enabled
  async configureValidationRefresh() {
    // Clear any existing validation refresh intervals before we do anything else
    this.clearValidationRefreshInterval();

    if (settings.isSaveToWebEnabled && settings.secretKey) {
      log('Validation refresh enabled and will run every 5 minute');
      this.validationRefreshInterval = window.setInterval(async () => {
        log('Validation refresh triggered - refreshing validation cache');
        try {
          await this.main.apiClient.isActive(true); // Force refresh
        } catch (error) {
          log('Validation refresh failed:', error);
        }
      }, 5 * 60 * 1000); // 5 minutes

      // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
      this.registerInterval(this.validationRefreshInterval);
    }
  }
}
