import { sync as readPackageUpSync } from 'read-pkg-up';

/**
 * Returns the version from package.json, or undefined if it cannot be found.
 *
 * This is a cached value, so it will only be calculated once.
 */
function getPackageVersion(): string | undefined {
  const result = readPackageUpSync({ cwd: __dirname });
  return result?.packageJson?.version;
}

export const PACKAGE_VERSION = getPackageVersion();
