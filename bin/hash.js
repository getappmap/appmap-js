const { readFileSync, writeFileSync } = require('node:fs');
const { createHash } = require('node:crypto');

// This script is essentially `shasum -a 256 -b`.

const input = process.argv[2];
const buffer = readFileSync(input);
const hash = createHash('sha256').update(buffer).digest('hex');
writeFileSync(input + '.sha256', hash);
