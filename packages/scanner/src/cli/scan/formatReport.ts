import { Metadata } from '@appland/models';

import { AppMapMetadata } from '../../report/scanSummary';
import { ScanResults } from '../../report/scanResults';

// Formats a report to JSON. Does some data deduplication.
export function formatReport(rawScanResults: ScanResults): string {
  const { summary, appMapMetadata, findings } = { ...rawScanResults };

  // remove metadata that's common between appmaps
  const filter = metadataFilter(summary.appMapMetadata);
  const metadata = Object.fromEntries(
    Object.entries(appMapMetadata).map(([id, metadata]) => [id, filter(metadata)])
  );

  // only keep one finding of the same hash
  const uniqueFindings = [...uniq(findings, ({ hash }) => hash)];

  return JSON.stringify(
    {
      ...rawScanResults,
      summary: { ...summary, numFindings: uniqueFindings.length },
      appMapMetadata: metadata,
      findings: uniqueFindings,
    },
    null,
    2
  );
}

function metadataFilter({
  apps: { length: apps },
  clients: { length: clients },
  frameworks: { length: frameworks },
  git: { length: git },
  languages: { length: languages },
  recorders: { length: recorders },
}: AppMapMetadata) {
  const filtered = Object.entries({
    app: apps < 2,
    client: clients < 2,
    git: git < 2,
    language: languages < 2,
    recorder: recorders < 2,
  })
    .filter(([, v]) => v)
    .map(([k]) => k);

  return function (metadata: Metadata): Partial<Metadata> {
    return Object.fromEntries(
      Object.entries(metadata).filter(([k, v]) => {
        if (filtered.includes(k)) return false;
        if (k === 'frameworks') return ((v || []) as never[]).length !== frameworks;
        return true;
      })
    );
  };
}

function uniq<T, K>(entries: Iterable<T>, key: (x: T) => K): Iterable<T> {
  const result = new Map<K, T>();

  for (const entry of entries) {
    const k = key(entry);
    if (result.has(k)) continue;
    result.set(k, entry);
  }

  return result.values();
}
