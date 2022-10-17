import tmp from 'tmp';
import { writeFile } from 'fs/promises';
import Configuration from '../../../src/cmds/record/configuration';

export default class TempConfig extends Configuration {
  constructor() {
    super(tmp.fileSync().name, tmp.tmpNameSync());
  }

  async initialize() {
    await writeFile(this.appMapFile, '{}');
    // Settings file does not have to exist

    await this.read();
  }
}
