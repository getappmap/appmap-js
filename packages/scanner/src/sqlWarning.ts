import { open, write } from 'fs';
import { ParseError } from '@appland/models';

let SqlWarningFileName: string | null = 'sql_warning.txt';
let messages: string[] | null = [];
let writeMessage: (msg: string) => void = (msg: string) => (messages ? messages.push(msg) : null);

process.on('exit', () => {
  if (!messages) return;

  [...new Set(messages)].forEach((msg) => console.warn(msg));
});

export default function sqlWarning(error: ParseError): void {
  if (SqlWarningFileName) {
    open(SqlWarningFileName, 'w', (err, fd) => {
      if (err || !fd) return;

      writeMessage = (msg) => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        write(fd, [msg, '\n'].join(''), () => {});
      };

      if (messages) messages.forEach(writeMessage);
      messages = null;
    });
    // Try only once
    SqlWarningFileName = null;
  }

  writeMessage(error.toString());
}
