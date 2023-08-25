import { stdout } from "node:process";
const { Promise } = globalThis;

const help = `
Usage: npx appmap-agent-js [help | version | run] ...

help
  Print this message
version
  Print the name and version of this npm package
run [default]
  Execute and record node processes
  Remaining positional arguments are understood as command token
  For instance:
      npx appmap-agent-js node main.js
      npx appmap-agent-js -- node main.js
  Named arguments are configuration fields:
  For instance:
      npx appmap-agent-js --map-name hello-world
      npx appmap-agent-js --map-name=hello-world
  Environment variables:
      APPMAP_CONFIGURATION_PATH
          Path to the configuration file, default: ./appmap.yml
      APPMAP_REPOSITORY_DIRECTORY
          Path to the repository directory, default: .

Further documentation:
  https://github.com/applandinc/appmap-agent-js

`;

export default new Promise((resolve, reject) => {
  stdout.write(help, "utf8", (error) => {
    if (error) {
      reject(error);
    } else {
      resolve(0);
    }
  });
});
