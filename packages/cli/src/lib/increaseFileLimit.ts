import os from 'os';

const posix = require('posix');
//import * as posix from 'posix';

export const MaxNumberOfFiles = 1048576;

export function increaseFileLimitTo(limit: Number | null, limitName: string): boolean {
    try {
      posix.setrlimit('nofile', { soft: limit, hard: limit });
      console.warn(`Success changing number of file descriptors to ${limitName}.${limitName}`);
      return true;
    } catch (err) {
      console.warn(`Error   changing number of file descriptors to ${limitName}.${limitName}: ${err}`);
      return false;
    }
}

export function increaseFileLimit() {
    // posix.setrlimit doesn't exist on Windows
    if (os.platform() === 'win32') return;

    // The limit of file descriptors per user is
    // - On darwin:            256 soft limit, can be increased to unlimited hard limit
    // - On linux Ubuntu 20:  1024 soft limit, can be increased to   1048576 hard limit
    // Increase this limit to be high, with exponential backoff to try a lower limit
    if (increaseFileLimitTo(null, "unlimited")) return;

    let divisor = 1;
    while (divisor <= 8) {
      const limitToUse = MaxNumberOfFiles / divisor;
      if (increaseFileLimitTo(limitToUse, limitToUse.toString())) return;
      divisor *= 2;
    }
}
