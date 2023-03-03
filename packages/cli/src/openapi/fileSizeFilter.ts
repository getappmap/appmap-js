import { Stats } from 'fs';
import { stat } from 'fs/promises';
import { FilterFunction } from '../cmds/openapi';

// Skip files that are larger than a specified max size.

export const DefaultMaxAppMapSizeInMB = 50;

export function fileSizeFilter(maxFileSize: number): FilterFunction {
  return async (file: string): Promise<{ enable: boolean; message?: string }> => {
    let fileStat: Stats;
    try {
      fileStat = await stat(file);
    } catch {
      return { enable: false, message: `File ${file} not found` };
    }

    if (fileStat.size <= maxFileSize) return { enable: true };
    else
      return {
        enable: false,
        message: `Skipping ${file} as its file size of ${fileStat.size} bytes is larger than the maximum configured file size of ${maxFileSize} bytes`,
      };
  };
}
