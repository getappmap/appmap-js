/* Regenerate vendor/mermaid-parser.cjs from the mermaid-parser-bundle package.
 *
 * mermaid-parser-bundle is ESM-only and @yao-pkg/pkg cannot snapshot an ESM
 * package out of node_modules, so navie ships a pre-bundled CJS copy. Run this
 * after bumping the mermaid-parser-bundle devDependency, then commit the
 * regenerated vendor/mermaid-parser.cjs.
 *
 *   yarn workspace @appland/navie vendor:mermaid
 */
import { build } from 'esbuild';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outfile = join(packageRoot, 'vendor', 'mermaid-parser.cjs');

// mermaid-parser-bundle does not export ./package.json, so report the declared
// range from our own manifest rather than the resolved version.
const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
const range = manifest.devDependencies['mermaid-parser-bundle'];

await mkdir(dirname(outfile), { recursive: true });

await build({
  stdin: {
    contents: "export { parse, MermaidParseError } from 'mermaid-parser-bundle';\n",
    resolveDir: packageRoot,
    loader: 'js',
  },
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  minify: true,
  outfile,
  logLevel: 'warning',
});

const { size } = await stat(outfile);
console.log(
  `wrote vendor/mermaid-parser.cjs (${(size / 1024 / 1024).toFixed(1)} MB) ` +
    `from mermaid-parser-bundle@${range}`
);
