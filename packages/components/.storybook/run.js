const { spawn } = require('child_process');
const { join } = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// Changes to these packages will not trigger a storybook run, because they are
// downstream of this package.
const nonDependencyPackages = ['cli', 'scanner'];

async function isBranch(branch) {
  const { stdout } = await exec('git branch --show-current');
  const currentBranch = stdout.trim();

  return currentBranch === branch;
}

async function noDependencyChanged() {
  const fetchResult = await exec('git fetch origin main:refs/remotes/origin/main');
  if (fetchResult.stderr || fetchResult.stdout)
    console.log("output from 'git fetch origin main:refs/remotes/origin/main': ", fetchResult);

  const { stdout: changedFiles } = await exec('git diff origin/main --name-only');
  return changedFiles
    .split('\n')
    .every((file) => nonDependencyPackages.some((pkg) => file.startsWith(join('packages', pkg))));
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

function isWindows() {
  return !!process.platform.match(/^win/);
}

(async () => {
  const detectDependencyChanged = !(await noDependencyChanged());
  const platformToTest = !isWindows();
  const runningOnMainBranch = await isBranch('main');
  console.log('Determining whether to run storybook.');
  console.log(`Has dependency changed? ${detectDependencyChanged}`);
  console.log(`Running on a platform we want to test? ${platformToTest}`);
  console.log(`Running on main branch? ${runningOnMainBranch}`);

  const shouldRunStorybook = platformToTest && (detectDependencyChanged || runningOnMainBranch);
  console.log(`Should run storybook? ${shouldRunStorybook}`);
  if (shouldRunStorybook) {
    process.exitCode = await runStorybook();
  }
})();
