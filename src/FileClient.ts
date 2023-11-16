import { FileSystemAdapter, TFile, Vault } from "obsidian";
import * as path from "path";

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
    const fileRelativePath = `${this.filePath ?? this.filePath + path.sep}${this.fileName}${this.fileExtension}`;
    const file = this.vault.getAbstractFileByPath(fileRelativePath);

    if (file instanceof TFile) {
      // File exists to update the contents
      await this.vault.modify(file, calendar);
    } else {
      // File does not exist so create it
      await this.vault.create(fileRelativePath, calendar);
    }
  }
}