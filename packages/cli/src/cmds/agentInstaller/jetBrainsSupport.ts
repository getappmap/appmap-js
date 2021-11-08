import glob from 'glob';
import os from 'os';
import path from 'path';

export function findIntelliJHome(): string | undefined {
  let defaultDir;
  if (os.platform() === 'win32') {
    defaultDir = 'C:/Program Files/JetBrains/IntelliJ*';
  } else if (os.platform() === 'darwin') {
    defaultDir = '/Applications/IntelliJ*.app/Contents';
  } else {
    return;
  }

  let jbHome = glob.sync(path.join(defaultDir));
  return jbHome.length !== 0 ? jbHome[0] : undefined;
}
