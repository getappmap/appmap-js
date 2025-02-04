import { sync as readPackageUpSync } from 'read-pkg-up';

let PACKAGE_VERSION: string | undefined | null = null;

/**
 * Returns the version from package.json, or undefined if it cannot be found.
 *
 * This is a cached value, so it will only be calculated once.
 */
export default function getPackageVersion(): string | undefined {
  if (PACKAGE_VERSION === null) {
    // `null` indicates that we haven't yet attempted to resolve a version.
    const result = readPackageUpSync({ cwd: __dirname });
    PACKAGE_VERSION = result?.packageJson?.version;
  }
  return PACKAGE_VERSION;
}
