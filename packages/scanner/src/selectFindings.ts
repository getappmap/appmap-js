import { FindingStatusListItem } from '@appland/client/dist/src';
import { FindingState } from './cli/findingsState';
import { Finding } from './types';

export default function selectFindings(
  findings: Finding[],
  knownFindings: FindingStatusListItem[],
  includeFindingStates: [FindingState.Deferred | FindingState.AsDesigned][]
): Finding[] {
  const statusByFindingDigest = knownFindings.reduce((memo, findingStatus) => {
    memo.set(
      findingStatus.identity_hash,
      // TODO: Would like to clean this up. The client package needs to be updated to know about
      // the valid finding states.
      findingStatus.status as unknown as FindingState
    );
    return memo;
  }, new Map<string, FindingState>());

  return findings.filter((finding) => {
    let status = statusByFindingDigest.get(finding.hash_v2);
    // TODO: Currently, hash_v2 and hash are both used to check known statuses.
    // Once hash is fully removed, this line can be removed.
    if (!status) status = statusByFindingDigest.get(finding.hash);
    return (
      status === undefined ||
      status === FindingState.Active ||
      includeFindingStates.includes(
        status as unknown as [FindingState.Deferred | FindingState.AsDesigned]
      )
    );
  });
}
