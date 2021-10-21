import {
  owner,
  pullRequestNumber,
  repo,
  token,
  validateOwner,
  validatePullRequestNumber,
  validateRepo,
  validateToken,
} from '../vars';

export default function postPullRequestComment(comment: string): Promise<any> {
  validateToken();
  validateOwner();
  validateRepo();
  validatePullRequestNumber();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const octokat = require('octokat');
  const octo = new octokat({ token: token() });

  return octo
    .repos(owner(), repo())
    .issues(pullRequestNumber())
    .comments.create({ body: `### AppMap Scanner\n${comment}` });
}
