// Exercise the repository's release packager, not a staged npm reconstruction.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const cli = path.resolve(__dirname, '..');
const root = path.resolve(cli, '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(cli, 'package.json')));
// Use the Yarn release the repository pins, whatever its version.
const yarnPath = /^yarnPath:\s*['"]?([^'"\n]+?)['"]?\s*$/m.exec(
  fs.readFileSync(path.join(root, '.yarnrc.yml'), 'utf8')
)?.[1];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
function inventory(directory, prefix = '') {
  return fs.readdirSync(path.join(directory, prefix)).flatMap((name) => {
    const relative = prefix ? `${prefix}/${name}` : name;
    const file = path.join(directory, relative);
    const stat = fs.lstatSync(file);
    assert.ok(!stat.isSymbolicLink(), `Unexpected asset symlink: ${relative}`);
    if (stat.isDirectory()) return inventory(directory, relative);
    assert.ok(stat.isFile(), `Unexpected asset type: ${relative}`);
    return [[relative, sha(fs.readFileSync(file))]];
  });
}
function noPhantomDeclarations(value) {
  assert.equal(
    Object.hasOwn(value, 'bundledDependencies'),
    false,
    'Compiled assets do not promise bundled package directories'
  );
  assert.equal(
    Object.hasOwn(value, 'bundleDependencies'),
    false,
    'The alias must not reintroduce the same promise'
  );
}
test('Given compiled assets, when reading the source manifest, then retain runtime dependencies without phantom bundle declarations', () => {
  noPhantomDeclarations(manifest);
  for (const name of ['@appland/components', '@appland/diagrams']) {
    assert.equal(typeof manifest.dependencies[name], 'string');
  }
});
test('Given a current workspace build, when Yarn packs the actual CLI, then normalized dependencies and every built/resource byte survive', () => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'appmap-yarn-pack-'));
  try {
    const archive = path.join(scratch, 'cli.tgz');
    const expected = ['built', 'resources'].flatMap((dir) => inventory(cli, dir));
    assert.ok(expected.length > 0, 'A real workspace build is required');
    assert.ok(yarnPath, 'The repository pins Yarn with yarnPath in .yarnrc.yml');
    execFileSync(
      process.execPath,
      [path.join(root, yarnPath), 'workspace', manifest.name, 'pack', '--out', archive],
      {
        cwd: root,
        encoding: 'utf8',
        timeout: 90000,
        maxBuffer: 4 * 1024 * 1024,
        env: { ...process.env, YARN_ENABLE_SCRIPTS: 'false', YARN_ENABLE_NETWORK: 'false' },
      }
    );
    const listing = execFileSync('tar', ['-tzf', archive], {
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    });
    const members = listing.trim().split('\n');
    assert.equal(new Set(members).size, members.length);
    assert.ok(
      members.every((name) => name.startsWith('package/') && !name.split('/').includes('..'))
    );
    assert.equal(
      members.some((name) => name.startsWith('package/node_modules/')),
      false
    );
    const unpacked = path.join(scratch, 'unpacked');
    fs.mkdirSync(unpacked);
    execFileSync('tar', ['-xzf', archive, '-C', unpacked]);
    const packageRoot = path.join(unpacked, 'package');
    const packed = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json')));
    noPhantomDeclarations(packed);
    assert.equal(packed.name, manifest.name);
    assert.equal(packed.version, manifest.version);
    for (const [name, version] of Object.entries(manifest.dependencies)) {
      assert.equal(packed.dependencies[name], version.replace(/^workspace:/, ''), name);
    }
    for (const [relative, hash] of expected) {
      assert.equal(sha(fs.readFileSync(path.join(packageRoot, relative))), hash, relative);
    }
    for (const relative of [
      'built/cli.js',
      'built/html/appmap.html',
      'built/html/appmap.js',
      'built/html/sequenceDiagram.html',
      'built/html/sequenceDiagram.js',
    ]) {
      assert.ok(members.includes(`package/${relative}`), relative);
    }
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});
