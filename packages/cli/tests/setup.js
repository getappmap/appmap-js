require('reflect-metadata');

const { container } = require('tsyringe');
const { ThreadIndexService } = require('../src/rpc/navie/services/threadIndexService');
const sqlite3 = require('better-sqlite3');
const db = new sqlite3(':memory:');

container.registerInstance(ThreadIndexService.DATABASE, db);
container.registerInstance('INavieProvider', () => ({}));
