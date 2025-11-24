// workaround for a bug in Node 25 that creates localStorage as an empty proxy,
// leading to jest eventually throwing when it sees that it is not
// undefined and tries to call `getItem`:

// https://github.com/nodejs/node/issues/60303

// this can be removed once the bug is addressed in Node
if (!globalThis.localStorage?.getItem)
	globalThis.localStorage = undefined

require('reflect-metadata');

const { container } = require('tsyringe');
const { ThreadIndexService } = require('../src/rpc/navie/services/threadIndexService');
const sqlite3 = require('better-sqlite3');
const db = new sqlite3(':memory:');

container.registerInstance(ThreadIndexService.DATABASE, db);
container.registerInstance('INavieProvider', () => ({}));
