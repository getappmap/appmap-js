import { createWriteStream } from 'fs';

const SqlWarningFileName = 'sql_warning.txt';
let /** @type {WriteStream} */ SqlWarningFile;

// eslint-disable-next-line import/prefer-default-export
export function warn(/** @type {string} */ message) {
  function writeMessage(msg) {
    SqlWarningFile.write([msg, '\n'].join(''));
  }

  let messages = [];
  if (!SqlWarningFile) {
    SqlWarningFile = createWriteStream(SqlWarningFileName);
    SqlWarningFile.on('open', () => {
      messages.forEach(writeMessage);
      messages = null;
    });
  }
  if (messages) {
    messages.push(message);
  }
}
