import { ValidationError } from '../errors';

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

function pullRequestNumber(): string | undefined {
  return (
    process.env.CIRCLE_PR_NUMBER || process.env.TRAVIS_PULL_REQUEST || process.env.CI_PR_NUMBER
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

function validateToken(): void {
  if (!token()) {
    throw new ValidationError(
      'GitHub token not configured (use GH_STATUS_TOKEN or GH_TOKEN env var)'
    );
  }
}

function validateSha(): void {
  if (!sha()) {
    throw new ValidationError('Unable to detect current build’s SHA');
  }
}

function validatePullRequestNumber(): void {
  if (!pullRequestNumber()) {
    throw new ValidationError('Unable to detect current pull request number');
  }
}

function validateOwner(): void {
  if (!owner()) {
    throw new ValidationError('Unable to detect repository owner');
  }
}

function validateRepo(): void {
  if (!repo()) {
    throw new ValidationError('Unable to detect repository name');
  }
}

export {
  token,
  owner,
  sha,
  repo,
  pullRequestNumber,
  validateToken,
  validateOwner,
  validateRepo,
  validateSha,
  validatePullRequestNumber,
};
