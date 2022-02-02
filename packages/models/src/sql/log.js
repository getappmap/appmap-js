import { open, write } from 'fs';

let SqlWarningFileName = 'sql_warning.txt';
let messages /** @type {string[]} */ = [];
let writeMessage = (msg) => messages.push(msg);

process.on('exit', () => {
  if (!messages) return;

  [...new Set(messages)].forEach((msg) => console.warn(msg));
});

// eslint-disable-next-line import/prefer-default-export
export function warn(/** @type {string} */ message) {
  if (SqlWarningFileName) {
    open(SqlWarningFileName, 'w', (err, fd) => {
      if (err || !fd) return;

      writeMessage = (msg) => write(fd, [msg, '\n'].join(''), () => {});

      messages.forEach(writeMessage);
      messages = null;
    });
    // Try only once
    SqlWarningFileName = null;
  }

  writeMessage(message);
}
