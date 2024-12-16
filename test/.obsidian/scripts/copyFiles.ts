import { rename, mkdir, access } from 'fs/promises';
import { join, resolve } from 'path';
import { constants } from 'fs';

const copyFiles = async () => {
  try {
    const currentDir = process.cwd();

    const sourceDir = resolve(currentDir, 'build');
    const targetDir = resolve(currentDir, 'test', '.obsidian', 'plugins', 'ical' );

    const filesToMove = ['main.js', 'manifest.json'];


    try {
      await access(targetDir, constants.F_OK);
    } catch {
      await mkdir(targetDir, { recursive: true });
      console.log(`Folder ${targetDir} created`);
    }

    for (const file of filesToMove) {
      const sourcePath = join(sourceDir, file);
      const targetPath = join(targetDir, file);

      await rename(sourcePath, targetPath);
      console.log(`${file} copied to ${targetDir}`);
    }
  } catch (error) {
    console.error('Error copying files:', error);
  }
};

copyFiles();
