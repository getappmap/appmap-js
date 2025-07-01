import { stat } from 'fs/promises';
import makeDebug from 'debug';

import { isBinaryFile as checkBinaryFile } from 'isbinaryfile';
import { basename } from 'path';

const debug = makeDebug('appmap:search:file-type');

const BINARY_FILE_MEMO = new Map<string, boolean>([
  // Binary files
  ['.7z', true],
  ['.aac', true],
  ['.avi', true],
  ['.bin', true],
  ['.bmp', true],
  ['.bz2', true],
  ['.class', true],
  ['.data', true],
  ['.dat', true],
  ['.dll', true],
  ['.doc', true],
  ['.docx', true],
  ['.dylib', true],
  ['.ear', true],
  ['.exe', true],
  ['.eot', true],
  ['.flac', true],
  ['.flv', true],
  ['.gif', true],
  ['.gz', true],
  ['.ico', true],
  ['.jar', true],
  ['.jpeg', true],
  ['.jpg', true],
  ['.js.map', true],
  ['.min.js', true],
  ['.min.css', true],
  ['.mkv', true],
  ['.mo', true],
  ['.mov', true],
  ['.mp3', true],
  ['.mp4', true],
  ['.mpg', true],
  ['.odt', true],
  ['.odp', true],
  ['.ods', true],
  ['.ogg', true],
  ['.otf', true],
  ['.pdf', true],
  ['.po', true],
  ['.png', true],
  ['.ppt', true],
  ['.pptx', true],
  ['.pyc', true],
  ['.rar', true],
  ['.rtf', true],
  ['.so', true],
  ['.svg', true],
  ['.tar', true],
  ['.tiff', true],
  ['.ttf', true],
  ['.wav', true],
  ['.webm', true],
  ['.webp', true],
  ['.woff', true],
  ['.woff2', true],
  ['.wmv', true],
  ['.xls', true],
  ['.xlsx', true],
  ['.xz', true],
  ['.yarn.lock', true],
  ['.zip', true],

  // Source code files
  ['.cjs', false],
  ['.mjs', false],
  ['.coffee', false],
  ['.dart', false],
  ['.el', false],
  ['.elm', false],
  ['.js', false],
  ['.ts', false],
  ['.jsx', false],
  ['.tsx', false],
  ['.py', false],
  ['.java', false],
  ['.rb', false],
  ['.php', false],
  ['.go', false],
  ['.rs', false],
  ['.cpp', false],
  ['.cc', false],
  ['.cxx', false],
  ['.h', false],
  ['.hpp', false],
  ['.cs', false],
  ['.swift', false],
  ['.kt', false],
  ['.kts', false],
  ['.scala', false],
  ['.lua', false],
  ['.sh', false],
  ['.bat', false],
  ['.pl', false],
  ['.sql', false],
  ['.html', false],
  ['.htm', false],
  ['.css', false],
  ['.scss', false],
  ['.sass', false],
  ['.less', false],
  ['.vue', false],
]);

const DATA_FILE_EXTENSIONS: string[] = [
  'cjs',
  'csv',
  'dat',
  'log',
  'json',
  'toml',
  'tsv',
  'yaml',
  'yml',
  'xml',
].map((ext) => '.' + ext);

const DEFAULT_LARGE_FILE_THRESHOLD = 50_000;

const largeFileThreshold = () => {
  const value = process.env.APPMAP_LARGE_FILE;
  if (value === undefined) return DEFAULT_LARGE_FILE_THRESHOLD;
  return parseInt(value);
};

const statFileSafe = async (filePath: string): Promise<number | undefined> => {
  try {
    const stats = await stat(filePath);
    return stats.size;
  } catch (error) {
    debug(`Error reading file: %s`, filePath);
    debug(error);
    return undefined;
  }
};

export const isLargeFile = async (fileName: string): Promise<boolean> => {
  const fileSize = await statFileSafe(fileName);
  if (fileSize === undefined) return false;

  const isLarge = fileSize > largeFileThreshold();
  if (isLarge) debug('File %s is considered large due to size %d', fileName, fileSize);

  return fileSize > largeFileThreshold();
};

/* Returns unique file extensions for the given file path.
 * E.g., for 'example.tar.gz', it returns [ '.tar.gz', '.gz'].
 */
export const getFileExtensions = (filePath: string): string[] => {
  const fileName = basename(filePath).toLowerCase();
  const parts = fileName.split('.');
  if (parts.length <= 1) return [];

  const extensions: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    const ext = '.' + parts.slice(i).join('.');
    extensions.push(ext);
  }
  return extensions;
};

export const isBinaryFile = async (filePath: string): Promise<boolean> => {
  const fileExtensions = getFileExtensions(filePath);
  for (const ext of fileExtensions) {
    if (BINARY_FILE_MEMO.has(ext)) {
      return BINARY_FILE_MEMO.get(ext) === true;
    }
  }

  try {
    const isBinary = await checkBinaryFile(filePath);
    fileExtensions.forEach((ext) => {
      BINARY_FILE_MEMO.set(ext, isBinary);
    });
    return isBinary;
  } catch (error) {
    debug(`Error reading file: %s`, filePath);
    debug(error);
    return false;
  }
};

export const isDataFile = (fileName: string): boolean => {
  return DATA_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
};
