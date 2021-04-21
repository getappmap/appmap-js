const grpc = require('@grpc/grpc-js');
const services = require('../../../static_codegen/protos/appmap_grpc_pb');
const messages = require('../../../static_codegen/protos/appmap_pb');

let index;

const client = new services.AppMapServiceClient(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

function end(resolve, reject) {
  return (e) => {
    if (e) {
      return reject(e);
    }

    return resolve(e);
  };
}

function createIndex() {
  return new Promise((resolve, reject) => {
    const createIndexMsg = new messages.CreateIndex();
    createIndexMsg.setAppMapDir('tests/unit/fixtures/depends');
    createIndexMsg.setBaseDir('src');
    client.createIndex(createIndexMsg, (err, newIndex) => {
      if (index) {
        console.warn(`I have an existing index: ${index.getHandle()}`);
      }
      index = newIndex;
      if (err) {
        return reject(err);
      }
      console.log(`Created new AppMap index ${index.getHandle()}`);
      resolve(index);
    });
  });
}

function cancelIndex() {
  return new Promise((resolve, reject) => {
    client.shutdownIndex(index, (err) => {
      if (err) {
        return reject(err);
      }
      console.log(`Shutdown AppMap index ${index.getHandle()}`);
      resolve();
    });
  });
}

/**
 * Run all of the demos in order
 */
function depends() {
  return new Promise((resolve, reject) => {
    const dependsParams = new messages.DependsParams();
    dependsParams.setIndex(index);
    dependsParams.setFilesList(['app/models/user.rb']);
    const call = client.depends(dependsParams);
    call.on('data', (appmap) => {
      console.log(appmap.getFileName());
      console.log(appmap.getMetadata().getName());
      console.log(appmap.getMetadata().getSourceLocation());
    });
    call.on('end', end(resolve, reject));
  });
}

if (require.main === module) {
  createIndex()
    .then(depends)
    .then(cancelIndex)
    .then(() => process.exit(0))
    .catch((err) => console.warn(err) || process.exit(1));
}
