import tmp from 'tmp';
import { unlink, writeFile } from 'fs/promises';
import { promisify } from 'util';
import {
  setAppMapConfigFilePath,
  setAppMapSettingsFilePath,
} from '../../../src/cmds/record/configuration';
import { dump } from 'js-yaml';

export default class TempConfig {
  configFile?: string;
  settingsFile?: string;
  originalConfigFile?: string;
  originalSettingsFile?: string;

  constructor() {}

  async initialize() {
    this.configFile = await promisify(tmp.file)();
    this.settingsFile = await promisify(tmp.file)();
    // Initially this will not exist until we create it. Better simulates a user environment.
    await unlink(this.settingsFile);

    this.originalConfigFile = setAppMapConfigFilePath(this.configFile);
    this.originalSettingsFile = setAppMapSettingsFilePath(this.settingsFile);

    await writeFile(this.configFile, dump({}));
    // Settings file does not have to exist
  }

  cleanup() {
    setAppMapConfigFilePath(this.originalConfigFile!);
    setAppMapSettingsFilePath(this.originalSettingsFile!);
  }
}
