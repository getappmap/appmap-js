import { ValidationError } from '../../errors';

type CommitStatusState = 'pending' | 'success' | 'error' | 'failure';

export default function postCommitStatus(
  state: CommitStatusState,
  description: string
): Promise<any> {
  validate();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const octokat = require('octokat');
  const octo = new octokat({ token: token() });

  return octo.repos(owner(), repo()).statuses(sha()).create({
    state: state,
    context: 'appland/scanner',
    description: description,
  });
}

function token(): string | undefined {
  return process.env.GH_STATUS_TOKEN || process.env.GH_TOKEN;
}

function sha(): string | undefined {
  return (
    process.env.CIRCLE_SHA1 ||
    process.env.TRAVIS_PULL_REQUEST_SHA ||
    process.env.TRAVIS_COMMIT ||
    process.env.CI_COMMIT_ID
  );
}

function owner(): string | undefined {
  return (
    process.env.CIRCLE_PROJECT_USERNAME ||
    extractSlug(process.env.TRAVIS_REPO_SLUG, 0) ||
    extractSlug(process.env.CI_REPO_OWNER, 0)
  );
}

function repo(): string | undefined {
  return (
    process.env.CIRCLE_PROJECT_REPONAME ||
    extractSlug(process.env.TRAVIS_REPO_SLUG, 1) ||
    extractSlug(process.env.CI_REPO_NAME, 1)
  );
}

function extractSlug(path: string | undefined, index: number): string | undefined {
  if (!path) {
    return undefined;
  }

  return path.split('/')[index];
}

function validate() {
  if (!token()) {
    throw new ValidationError(
      'GitHub token not configured (use GH_STATUS_TOKEN or GH_TOKEN env var)'
    );
  }
  if (!sha()) {
    throw new ValidationError('Unable to detect current build’s SHA');
  }
  if (!owner()) {
    throw new ValidationError('Unable to detect repository owner');
  }
  if (!repo()) {
    throw new ValidationError('Unable to detect repository name');
  }
}
