import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageRoot = resolve(__dirname, '../..');

describe('compiled-assets-only CLI packaging', () => {
  it('Given compiled viewers, when reading the source manifest, then preserve runtime dependencies without phantom bundles', () => {
    const manifest = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8')) as {
      bundledDependencies?: string[];
      bundleDependencies?: string[];
      dependencies: Record<string, string>;
    };
    expect(manifest.bundledDependencies).toBeUndefined();
    expect(manifest.bundleDependencies).toBeUndefined();
    expect(manifest.dependencies['@appland/components']).toBeDefined();
    expect(manifest.dependencies['@appland/diagrams']).toBeDefined();
  });

  it('Given a workspace build, when packed by Yarn, then the actual archive preserves assets and normalized dependencies', () => {
    try {
      execFileSync(
        process.execPath,
        ['--test', resolve(__dirname, '../compiled-assets-pack.test.cjs')],
        {
          cwd: packageRoot,
          encoding: 'utf8',
          maxBuffer: 4 * 1024 * 1024,
          timeout: 100000,
        }
      );
    } catch (error) {
      // node:test reports its assertions on stdout; keep them in the Jest failure.
      const { message, stdout, stderr } = error as Error & { stdout?: string; stderr?: string };
      throw new Error(`The archive test failed: ${message}\n${stdout ?? ''}${stderr ?? ''}`, {
        cause: error,
      });
    }
  }, 110000);
});
