require('reflect-metadata');

const { container } = require('tsyringe');
const { ThreadIndexService } = require('../src/rpc/navie/services/threadIndexService');
const sqlite3 = require('better-sqlite3');
const { default: NavieService } = require('../src/rpc/navie/services/navieService');

const db = new sqlite3(':memory:');
container.registerInstance(ThreadIndexService.DATABASE, db);
container.registerInstance(NavieService.NAVIE_PROVIDER, () => ({}));
