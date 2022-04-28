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
): Promise<any> {
  validateToken();
  validateRepo();
  validateOwner();
  validateSha();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const octokat = require('octokat');
  const octo = new octokat({ token: token() });

  return octo.repos(owner(), repo()).statuses(sha()).create({
    state: state,
    context: 'appland/scanner',
    description: description,
  });
}
