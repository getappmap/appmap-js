import { TrajectoryEvent } from '@appland/navie';
import fs, { mkdirSync } from 'fs';
import path from 'path';

export default class Trajectory {
  private stream: fs.WriteStream | undefined = undefined;
  private openedStream = false;

  constructor(public filePath: string) {}

  logMessage(message: TrajectoryEvent) {
    if (!this.openedStream) {
      const fileDir = path.dirname(this.filePath);
      mkdirSync(fileDir, { recursive: true });
      this.stream = fs.createWriteStream(this.filePath, { flags: 'a' });
      this.openedStream = true;
    }

    if (this.stream) this.stream.write(`${JSON.stringify(message)}\n`);
  }

  close() {
    if (this.stream) this.stream.end();

    this.stream = undefined;
  }
}
