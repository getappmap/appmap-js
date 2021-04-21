const grpc = require('@grpc/grpc-js');
const services = require('../../../static_codegen/protos/appmap_grpc_pb');
const messages = require('../../../static_codegen/protos/appmap_pb');
const Depends = require('../cli/depends');
const { verbose, metadataField, metadata } = require('../cli/utils');

async function createIndex() {}

async function watchIndex() {}

async function cancelIndex() {}

async function depends(call) {
  const appmapDir = call.request.getIndex().getAppMapDir();
  const baseDir = call.request.getIndex().getBaseDir();
  const files = call.request.getFilesList();
  const useModifiedTime = call.request.getUseModifiedTime();

  if (verbose()) {
    console.debug(appmapDir, baseDir, files, useModifiedTime);
  }

  const dependsFn = new Depends(appmapDir);
  if (baseDir) {
    dependsFn.baseDir = baseDir;
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
