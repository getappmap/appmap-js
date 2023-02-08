#!/usr/bin/env node

import fs from 'fs/promises';
import { join } from 'path';
import { pathToFileURL } from 'url';

const pkgs = (await fs.readdir('.'))
  .filter((f) => /@appland-.*\.tgz/.test(f))
  .map((f) => f.replace(/\.tgz$/, ''));

const pwd = process.cwd();

function file(pkg) {
  return pathToFileURL(join(pwd, `${pkg}.tgz`));
}

const resolutions = Object.fromEntries(pkgs.map((pkg) => [pkg.replace('-', '/'), file(pkg)]));

await fs.writeFile(
  'package.json',
  JSON.stringify(
    {
      resolutions,
      dependencies: { '@appland/appmap': file('@appland-appmap') },
    },
    undefined,
    2
  )
);
