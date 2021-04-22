const grpc = require('@grpc/grpc-js');
const services = require('../../../static_codegen/protos/appmap_grpc_pb');
const messages = require('../../../static_codegen/protos/appmap_pb');

const client = new services.AppMapServiceClient(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

/**
 * Run all of the demos in order
 */
async function main() {
  return new Promise((resolve, reject) => {
    const dependsParams = new messages.DependsParams();
    dependsParams.setAppMapDir('tests/unit/fixtures/depends');
    const file = new messages.File();
    file.setName('app/models/user.rb');
    dependsParams.setFilesList([file]);
    const call = client.depends(dependsParams);
    call.on('data', (appmap) => {
      console.log(appmap.getFile().getName());
    });
    call.on('end', (e) => {
      if (e) {
        return reject(e);
      }

      return resolve(e);
    });
  });
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => console.warn(err) || process.exit(1));
}
