const grpc = require('@grpc/grpc-js');
const { v4: uuidv4 } = require('uuid');
const services = require('../../../static_codegen/protos/appmap_grpc_pb');
const messages = require('../../../static_codegen/protos/appmap_pb');
const Depends = require('../cli/depends');
const FingerprintWatchCommand = require('../cli/fingerprintWatchCommand');
const { verbose, metadata } = require('../cli/utils');

class Indexer {
  constructor(appMapDir, baseDir) {
    this.appMapDir = appMapDir;
    this.baseDir = baseDir;
    this.handle = uuidv4();
  }

  start() {
    this.fingerprinter = new FingerprintWatchCommand(this.appMapDir);
    this.fingerprinter.setPrint(true);
    this.fingerprinter.execute();
  }

  shutdown() {
    this.fingerprinter.shutdown();
  }
}

const indexers = {};

function getIndexer(handle, fail) {
  const indexer = indexers[handle];
  if (!indexer) {
    fail(`Indexer ${indexer.getHandle()} not found`);
    return false;
  }
  return indexer;
}

async function createIndex(call, callback) {
  const indexer = new Indexer(
    call.request.getAppMapDir(),
    call.request.getBaseDir()
  );
  indexers[indexer.handle] = indexer;
  const index = new messages.Index();
  index.setHandle(indexer.handle);
  indexer.start();
  callback(null, index);
}

async function watchIndex(call) {
  const indexer = getIndexer(call.request.getHandle(), (err) => call.end(err));
  if (!indexer) {
    return;
  }

  indexer.watch(call);
}

async function shutdownIndex(call, callback) {
  const indexer = getIndexer(call.request.getHandle(), callback);
  if (!indexer) {
    return;
  }

  console.log(`Shutting down ${call.request.getHandle()}`);
  indexer.shutdown();
  callback(null, new messages.CancelIndexResult());
}

async function depends(call) {
  const indexer = getIndexer(call.request.getIndex().getHandle(), (err) =>
    call.end(err)
  );
  if (!indexer) {
    return;
  }

  const files = call.request.getFilesList();
  const useModifiedTime = call.request.getUseModifiedTime();

  if (verbose()) {
    console.debug(indexer.appMapDir, indexer.baseDir, files, useModifiedTime);
  }

  const dependsFn = new Depends(indexer.appMapDir);
  if (indexer.baseDir) {
    dependsFn.baseDir = indexer.baseDir;
  }
  if (!useModifiedTime && files.length > 0) {
    dependsFn.files = files;
  }

  const appmaps = await dependsFn.depends();
  if (verbose()) {
    console.debug(appmaps);
  }
  await Promise.all(
    appmaps.map(async (appMapBaseName) => {
      const md = await metadata(appMapBaseName);
      const grpcMd = new messages.AppMapMetadata();
      grpcMd.setName(md.name);
      grpcMd.setSourceLocation(md.source_location);
      const appmap = new messages.AppMap();
      appmap.setFileName(`${appMapBaseName}.appmap.json`);
      appmap.setMetadata(grpcMd);
      call.write(appmap);
    })
  );
  call.end();
}

/**
 * Get a new server with the handler functions in this file bound to the methods
 * it serves.
 * @return {grpc.Server} The new server object
 */
function Server() {
  const serverObj = new grpc.Server();
  serverObj.addService(services.AppMapServiceService, {
    createIndex,
    watchIndex,
    shutdownIndex,
    depends,
  });
  return serverObj;
}

if (require.main === module) {
  verbose(true);

  // If this is run as a script, start a server on an unused port
  const serverObj = Server();
  serverObj.bindAsync(
    '0.0.0.0:50051',
    grpc.ServerCredentials.createInsecure(),
    () => {
      serverObj.start();
    }
  );
}

module.exports = Server;
