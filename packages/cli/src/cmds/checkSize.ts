import { ValidationError } from './errors';
import { Stats } from 'fs';
import { MAX_APPMAP_SIZE } from './upload';

export function checkSize({ size }: Stats): void {
  if (size > MAX_APPMAP_SIZE)
    throw new ValidationError(
      [
        `File size is ${size / 1024} KiB which is greater than the size limit of ${
          MAX_APPMAP_SIZE / 1024
        } KiB.`,
        'Use --force if you want to upload it anyway.',
      ].join('\n')
    );
}
