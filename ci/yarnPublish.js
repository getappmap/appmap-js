const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

async function verifyConditions(pluginConfig, context) {
  if (!context.env['YARN_NPM_AUTH_TOKEN']) {
    throw new Error(
      'YARN_NPM_AUTH_TOKEN environment variable must be specified.'
    );
  }
}

async function publish(pluginConfig, context) {
  const { stdout, stderr } = exec('yarn npm publish');
  if (stderr) {
    throw new Error(`failed to publish: ${stderr}`);
  }

  return { name: 'NPM publish' };
}

module.exports = { verifyConditions, publish };
