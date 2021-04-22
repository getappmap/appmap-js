const grpc = require('@grpc/grpc-js');
const services = require('../../../static_codegen/protos/appmap_grpc_pb');
const messages = require('../../../static_codegen/protos/appmap_pb');
const Depends = require('../cli/depends');
const { verbose } = require('../cli/utils');

verbose(true);

async function depends(call) {
  const files = call.request.getFilesList().map((file) => file.getName());
  const useModifiedTime = call.request.getUseModifiedTime();
  const appmapDir = call.request.getAppMapDir();
  const baseDir = call.request.getBaseDir();

  console.log(files, useModifiedTime, appmapDir, baseDir);

  const dependsFn = new Depends(appmapDir);
  if (baseDir) {
    dependsFn.baseDir = baseDir;
  }
  if (!useModifiedTime && files.length > 0) {
    dependsFn.files = files;
  }

  const appmaps = await dependsFn.depends();
  console.log(appmaps);
  appmaps.forEach((result) => {
    const appmap = new messages.AppMap();
    appmap.setSourceLocation(result);
    call.write(appmap);
  });
  call.end();
}

/**
 * Get a new server with the handler functions in this file bound to the methods
 * it serves.
 * @return {Server} The new server object
 */
function getServer() {
  const server = new grpc.Server();
  console.log(services);
  server.addService(services.AppMapServiceService, {
    depends,
  });
  return server;
}

if (require.main === module) {
  // If this is run as a script, start a server on an unused port
  const server = getServer();
  server.bindAsync(
    '0.0.0.0:50051',
    grpc.ServerCredentials.createInsecure(),
    () => {
      server.start();
    }
  );
}

exports.getServer = getServer;
