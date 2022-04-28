import { FindingStatusListItem } from '@appland/client/dist/src';
import { Finding } from './types';

export function newFindings(
  findings: Finding[],
  findingStatuses: FindingStatusListItem[]
): Finding[] {
  const statusByFindingDigest = findingStatuses.reduce((memo, findingStatus) => {
    memo.set(findingStatus.identity_hash, findingStatus.status);
    return memo;
  }, new Map<string, string>());

  return findings.filter((finding) => {
    const status = statusByFindingDigest.get(finding.hash);
    return !status || status === 'new';
  });
}
