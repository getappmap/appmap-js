const { exec } = require('child_process');

async function runCommand(command) {
  return new Promise((resolve, reject) => {
    const cp = exec(command.toString(), {
      env: Object.assign(process.env, command.environment),
      cwd: this.path,
    });
    cp.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    cp.stdout.on('data', (data) => {
      process.stderr.write(data);
    });

    cp.on('exit', (code) => {
      console.log(`'${command.program}' exited with code ${code}`);
      if (code === 0) {
        return resolve();
      }

      return reject(code);
    });
  });
}

module.exports = runCommand;
