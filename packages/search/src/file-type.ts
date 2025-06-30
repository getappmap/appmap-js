import { stat } from 'fs/promises';
import makeDebug from 'debug';

import { isBinaryFile as checkBinaryFile } from 'isbinaryfile';

const debug = makeDebug('appmap:search:file-type');

const BINARY_FILE_EXTENSIONS: string[] = [
  '7z',
  'aac',
  'avi',
  'bmp',
  'bz2',
  'class',
  'dll',
  'doc',
  'docx',
  'dylib',
  'ear',
  'exe',
  'eot',
  'flac',
  'flv',
  'gif',
  'gz',
  'ico',
  'jar',
  'jpeg',
  'jpg',
  'js.map',
  'min.js',
  'min.css',
  'mkv',
  'mo',
  'mov',
  'mp3',
  'mp4',
  'mpg',
  'odt',
  'odp',
  'ods',
  'ogg',
  'otf',
  'pdf',
  'po',
  'png',
  'ppt',
  'pptx',
  'pyc',
  'rar',
  'rtf',
  'so',
  'svg',
  'tar',
  'tiff',
  'ttf',
  'wav',
  'webm',
  'webp',
  'woff',
  'woff2',
  'wmv',
  'xls',
  'xlsx',
  'xz',
  'yarn.lock',
  'zip',
].map((ext) => '.' + ext);

const DATA_FILE_EXTENSIONS: string[] = [
  'cjs',
  'csv',
  'dat',
  'log',
  'json',
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

export const isBinaryFile = async (filePath: string): Promise<boolean> => {
  if (BINARY_FILE_EXTENSIONS.some((ext) => filePath.endsWith(ext))) return true;
  try {
    return await checkBinaryFile(filePath);
  } catch (error) {
    debug(`Error reading file: %s`, filePath);
    debug(error);
    return false;
  }
};

export const isDataFile = (fileName: string): boolean => {
  return DATA_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
};
