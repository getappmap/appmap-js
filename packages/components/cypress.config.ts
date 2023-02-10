import { defineConfig } from 'cypress';

module.exports = defineConfig({
  projectId: 'u6g85i',
  e2e: {
    specPattern: 'tests/e2e/specs/**/*.spec.{js,ts}',
    supportFile: 'tests/e2e/support/index.js',
    videosFolder: 'tests/e2e/videos',
    screenshotsFolder: 'tests/e2e/screenshots',
    fixturesFolder: 'tests/e2e/fixtures',
  },
});
