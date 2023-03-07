import { defineConfig } from 'cypress';

export default defineConfig({
  scrollBehavior: 'center',
  fixturesFolder: 'tests/e2e/fixtures',
  screenshotsFolder: 'tests/e2e/screenshots',
  videosFolder: 'tests/e2e/videos',
  e2e: {
    specPattern: 'tests/e2e/specs/**/*.spec.{js,jsx,ts,tsx}',
    supportFile: 'tests/e2e/support/index.js',
  },
});
