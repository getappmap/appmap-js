import assert from 'assert';
import { readdir } from 'fs/promises';
import { basename, join } from 'path';

export const COMMON_REPO_BINARY_FILE_EXTENSIONS: string[] = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'ico',
  'tiff',
  'webp',
  'svg',
  'mp3',
  'wav',
  'ogg',
  'flac',
  'aac',
  'mp4',
  'webm',
  'mkv',
  'avi',
  'mov',
  'wmv',
  'mpg',
  'flv',
  'zip',
  'tar',
  'gz',
  'bz2',
  'xz',
  '7z',
  'rar',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'odt',
  'ods',
  'odp',
  'rtf',
  'woff',
  'woff2',
  'eot',
  'ttf',
  'otf',
  'ico',
  'flv',
  'avi',
  'mov',
  'wmv',
  'mpg',
  'jar',
  'war',
  'ear',
  'class',
  'so',
  'dll',
  'exe',
  'min.js',
  'min.css',
];

const IGNORE_DIRECTORIES = ['node_modules', 'vendor', 'tmp', 'build', 'dist', 'target'];

const DEFAULT_PROJECT_FILE_LIMIT = 1000;

export function isBinaryFile(fileName: string): boolean {
  const extension = fileName.split('.').pop();
  if (extension && COMMON_REPO_BINARY_FILE_EXTENSIONS.includes(extension)) return true;

  return false;
}

// Produce a modest-sized listing of files in the project.
// Ignore a standard list of binary file extensions and directories that tend to be full of
// non-source files.
export default async function listProjectFiles(
  directory: string,
  fileLimit = DEFAULT_PROJECT_FILE_LIMIT
): Promise<string[]> {
  const files = new Array<string>();

  const ignoreDirectory = (dir: string) => IGNORE_DIRECTORIES.includes(dir);
  const ignoreFile = (file: string) => isBinaryFile(file);

  // Perform a breadth-first traversal of a directory, collecting all non-binary files and
  // applying the directory ignore list.
  const processDir = async (dir: string) => {
    const queue = [dir];
    while (queue.length > 0 && files.length < fileLimit) {
      const currentDir = queue.shift();
      assert(currentDir, 'queue should not be empty');

      const entries = await readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);
        if (entry.isDirectory()) {
          if (!ignoreDirectory(entry.name)) queue.push(fullPath);
        } else if (entry.isFile()) {
          if (!ignoreFile(entry.name)) files.push(fullPath);
        }
      }
    }
  };

  await processDir(directory);

  return files;
}
