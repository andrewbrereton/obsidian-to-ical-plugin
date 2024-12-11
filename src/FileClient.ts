import { TFile, Vault } from 'obsidian'
import { log } from './Logger'
import { settings } from './SettingsManager'

export class FileClient {
  vault: Vault

  constructor(vault: Vault) {
    this.vault = vault
  }

  async save(calendar: string) {
    const fileRelativePath = `${settings.savePath ?? settings.savePath + '/'}${settings.saveFileName}${settings.saveFileExtension}`
    const file = this.vault.getAbstractFileByPath(fileRelativePath)

    if (file instanceof TFile) {
      // File exists to update the contents
      log('File exists: updating')
      await this.vault.modify(file, calendar)
    } else {
      // File does not exist so create it
      log('File does not exist: creating')
      await this.vault.create(fileRelativePath, calendar)
    }
  }
}
