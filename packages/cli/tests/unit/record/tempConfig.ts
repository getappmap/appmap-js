import tmp from 'tmp';
import { unlink, writeFile } from 'fs/promises';
import Configuration from '../../../src/cmds/record/configuration';

export default class TempConfig extends Configuration {
  constructor() {
    super(tmp.fileSync().name, tmp.fileSync().name);
  }

  async initialize() {
    // Initially this will not exist until we create it. Better simulates a user environment.
    await unlink(this.settingsFile);

    await writeFile(this.appMapFile, '{}');
    // Settings file does not have to exist

    await this.read();
  }
}
