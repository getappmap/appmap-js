import { Octokit } from 'octokit';

import {
  owner,
  repo,
  sha,
  token,
  validateOwner,
  validateRepo,
  validateSha,
  validateToken,
} from '../vars';

type CommitStatusState = 'pending' | 'success' | 'error' | 'failure';

export default function postCommitStatus(
  state: CommitStatusState,
  description: string
): Promise<unknown> {
  validateToken();
  validateRepo();
  validateOwner();
  validateSha();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const octo = new Octokit({ auth: token() });

  return octo.rest.repos.createCommitStatus({
    owner: owner()!,
    repo: repo()!,
    sha: sha()!,
    state: state,
    context: 'appland/scanner',
    description: description,
  });
}
