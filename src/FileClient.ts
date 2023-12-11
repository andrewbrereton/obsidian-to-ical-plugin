import { TFile, Vault } from 'obsidian';
import { log } from './Logger';

export class FileClient {
  vault: Vault;
  filePath: string;
  fileName: string;
  fileExtension: string;

  constructor(vault: Vault, filePath: string, fileName: string, fileExtension: string) {
    this.vault = vault;
    this.filePath = filePath;
    this.fileName = fileName;
    this.fileExtension = fileExtension;
  }

  async save(calendar: string) {
    const fileRelativePath = `${this.filePath ?? this.filePath + '/'}${this.fileName}${this.fileExtension}`;
    const file = this.vault.getAbstractFileByPath(fileRelativePath);

    if (file instanceof TFile) {
      // File exists to update the contents
      log('File exists: updating');
      await this.vault.modify(file, calendar);
    } else {
      // File does not exist so create it
      log('File does not exist: creating');
      await this.vault.create(fileRelativePath, calendar);
    }
  }
}
