const util = require('util');
const exec = util.promisify(require('child_process').exec);

function command(port) {
  const win = {
    exe: '\\windows\\system32\\netstat.exe',
    arg: [`-a -n -o ^| findstr :${port}`],
    cmd: `\\windows\\system32\\netstat.exe -a -n -o | findstr.exe :${port}`,
  };

  const dar = {
    exe: 'lsof',
    arg: ['-i', `:${port}`],
    cmd: `lsof -i :${port}`,
  };

  return process.platform === 'win32' ? win : dar;
}

function netstats(port) {
  if (typeof port !== 'number') {
    throw new TypeError('Expected a port number');
  }

  const cmd = command(port);

  return exec(cmd.cmd).then(({ stdout }) => Promise.resolve(stdout.split('\n'))).catch(err => Promise.reject(err));
}

module.exports = netstats;
