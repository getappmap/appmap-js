require('reflect-metadata');

const { container } = require('tsyringe');
const { ThreadIndexService } = require('../src/rpc/navie/services/threadIndexService');
const sqlite3 = require('node-sqlite3-wasm');
const { default: NavieService } = require('../src/rpc/navie/services/navieService');

const db = new sqlite3.Database(':memory:');
container.registerInstance(ThreadIndexService.DATABASE, db);
container.registerInstance(NavieService.NAVIE_PROVIDER, () => ({}));
