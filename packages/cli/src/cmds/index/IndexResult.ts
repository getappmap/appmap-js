import type { Metadata } from '@appland/models';

export type IndexResult = {
  error?: Error;
  metadata: Metadata;
  numEvents: number;
};
