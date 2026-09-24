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

const GITHUB_API_URL = 'https://api.github.com';

export default async function postCommitStatus(
  state: CommitStatusState,
  description: string
): Promise<unknown> {
  validateToken();
  validateRepo();
  validateOwner();
  validateSha();

  const url = `${GITHUB_API_URL}/repos/${encodeURIComponent(owner()!)}/${encodeURIComponent(
    repo()!
  )}/statuses/${encodeURIComponent(sha()!)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `token ${token()!}`,
      'content-type': 'application/json',
      'user-agent': 'appland-scanner',
      'x-github-api-version': '2022-11-28',
    },
    body: JSON.stringify({
      state,
      context: 'appland/scanner',
      description,
    }),
  });

  if (!response.ok)
    throw new Error(
      `Failed to update commit status: ${response.status} ${
        response.statusText
      } ${await response.text()}`
    );

  return (await response.json()) as unknown;
}
