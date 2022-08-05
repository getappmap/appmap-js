import countAppMaps from './action/countAppMaps';
import {
  locationString,
  readConfigOption,
  readSetting,
  TestCommand,
} from './configuration';

export default class RecordContext {
  public recordMethod?: string;
  public url?: string;
  public testCommands?: string[];
  public maxTime?: number;
  public initialAppMapCount?: number;
  public appMapCount?: number;
  public appMapEventCount?: number;
  public exitCodes?: number[];

  constructor(public appMapDir: string) {}

  async initialize() {
    this.initialAppMapCount = await countAppMaps(this.appMapDir);
  }

  properties(): Record<string, string> {
    const result = {} as Record<string, string>;
    if (this.recordMethod) result.recordMethod = this.recordMethod;
    if (this.url) result.url = this.url;
    if (this.testCommands) result.testCommands = this.testCommands.join('; ');
    if (this.exitCodes)
      result.exitCodes = this.exitCodes.map(String).join(', ');
    return result;
  }

  metrics(): Record<string, number> {
    const result = {} as Record<string, number>;
    if (this.maxTime) result.maxTime = this.maxTime;
    if (this.initialAppMapCount !== undefined) {
      result.initialAppMapCount = this.initialAppMapCount;
    }
    if (this.appMapCount !== undefined) {
      result.appMapCount = this.appMapCount;
    }
    if (this.appMapEventCount !== undefined) {
      result.appMapEventCount = this.appMapEventCount;
    }
    return result;
  }

  async populateURL() {
    this.url = await locationString();
  }

  async populateTestCommands() {
    this.testCommands = (
      (await readConfigOption(
        'test_recording.test_commands',
        []
      )) as TestCommand[]
    ).map(TestCommand.toString);
  }

  async populateMaxTime() {
    this.maxTime = (await readSetting('test_recording.max_time', 30)) as number;
  }

  async populateAppMapCount() {
    const appMapCount = await countAppMaps(this.appMapDir);
    this.appMapCount = appMapCount;
  }
}
