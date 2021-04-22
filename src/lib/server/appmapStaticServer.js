const grpc = require('@grpc/grpc-js');
const services = require('../../../static_codegen/protos/appmap_grpc_pb');
const messages = require('../../../static_codegen/protos/appmap_pb');
const Depends = require('../cli/depends');
const { verbose, metadataField } = require('../cli/utils');

async function depends(call) {
  const files = call.request.getFilesList().map((file) => file.getName());
  const useModifiedTime = call.request.getUseModifiedTime();
  const appmapDir = call.request.getAppMapDir();
  const baseDir = call.request.getBaseDir();

  if (verbose()) {
    console.debug(files, useModifiedTime, appmapDir, baseDir);
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
      const appmap = new messages.AppMap();
      const name = await metadataField(appMapBaseName, 'name');
      const sourceLocation = await metadataField(
        appMapBaseName,
        'source_location'
      );
      const file = new messages.File();
      file.setName(`${appMapBaseName}.appmap.json`);
      appmap.setFile(file);
      appmap.setName(name);
      if (sourceLocation) {
        appmap.setSourceLocation(sourceLocation);
      }
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
