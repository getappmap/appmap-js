const { spawn } = require('child_process');
const { join } = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const dependentPackages = ['components', 'models'];

function isTag() {
  return Boolean(process.env['TRAVIS_TAG']);
}

async function isBranch(branch) {
  let currentBranch = process.env['TRAVIS_BRANCH'];
  if (!currentBranch) {
    const { stdout } = await exec('git branch --show-current');
    currentBranch = stdout.trim();
  }

  return currentBranch === branch;
}

async function hasDependencyChanged() {
  const fetchResult = await exec('git fetch origin main:refs/remotes/origin/main');
  if (fetchResult.stderr || fetchResult.stdout)
    console.warn("output from 'git fetch origin main:refs/remotes/origin/main': ", fetchResult);

  const { stdout: changedFiles } = await exec('git diff origin/main --name-only');
  return changedFiles
    .split('\n')
    .some((file) => dependentPackages.some((pkg) => file.startsWith(join('packages', pkg))));
}

async function runStorybook() {
  return new Promise((resolve, reject) => {
    const args = [
      'npm run storybook -- --ci --quiet',
      'http://localhost:6006/iframe.html',
      'npm run test:e2e -- --headless --record false',
    ];
    const process = spawn('server-test', args, {
      shell: false,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    process.on('error', reject);
    process.on('exit', resolve);
  });
}

(async () => {
  const shouldRunStorybook = (await isBranch('main')) || isTag() || (await hasDependencyChanged());

  if (shouldRunStorybook) {
    process.exitCode = await runStorybook();
  }
})();
