import assert from 'assert';
import countAppMaps from './action/countAppMaps';
import Configuration, { TestCommand } from './configuration';
import { RemoteRecordingError } from './makeRequest';
export class RecordProcessResult {
  constructor(
    private _env: Record<string, string>,
    public command: string,
    public exitCode: number,
    public output: string
  ) {}

  get env(): Record<string, string> {
    return Object.fromEntries(
      Object.entries(this._env).filter(([k, _]) => {
        return k.startsWith('APPMAP') && !k.includes('KEY');
      })
    );
  }
}

export default class RecordContext {
  public recordMethod?: string;
  public url?: string;
  public testCommands?: string[];
  public maxTime?: number;
  public initialAppMapCount?: number;
  public appMapCount?: number;
  public appMapEventCount?: number;
  public remoteError?: RemoteRecordingError;
  private _results?: RecordProcessResult[];
  public appMapDir?: string;

  constructor(public configuration: Configuration) {}

  async initialize() {
    await this.configuration.read();
    this.appMapDir = this.configuration.configOption('appmap_dir', '.') as string;
    this.initialAppMapCount = await countAppMaps(this.appMapDir);
  }

  properties(): Record<string, string> {
    const result = {} as Record<string, string>;
    if (this.recordMethod) result.recordMethod = this.recordMethod;
    if (this.url) result.url = this.url;
    if (this.testCommands) result.testCommands = this.testCommands.join('; ');
    if (this.results) {
      result.exitCodes = this.exitCodes.map(String).join(', ');
      result.log = this.results
        .map((r) => [r.command, JSON.stringify(r.env), r.output].join('\n===\n'))
        .join('\n=====\n');
    }
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

  populateURL() {
    this.url = this.configuration.locationString();
  }

  populateTestCommands() {
    this.testCommands = (
      this.configuration.configOption('test_recording.test_commands', []) as TestCommand[]
    ).map(TestCommand.toString);
  }

  async populateMaxTime() {
    this.maxTime = this.configuration.setting('test_recording.max_time', 30) as number;
  }

  async populateAppMapCount() {
    assert(this.appMapDir);
    const appMapCount = await countAppMaps(this.appMapDir);
    this.appMapCount = appMapCount;
  }

  // Return the number of AppMaps created during this recording
  get appMapsCreated(): number {
    if (this.initialAppMapCount === undefined || this.appMapCount === undefined) {
      throw new Error(
        `Counts uninitialized, initialAppMapCount: ${this.initialAppMapCount} appMapCount: ${this.appMapCount}`
      );
    }

    return this.appMapCount - this.initialAppMapCount;
  }

  get results(): RecordProcessResult[] | undefined {
    return this._results;
  }

  addResult(result: RecordProcessResult) {
    if (!this._results) {
      this._results = [];
    }
    this._results.push(result);
  }

  // The following are only available once the test commands have finished. Check to see whether
  // this.results is defined before calling any of them.

  get exitCodes(): number[] {
    if (!this.results) throw new Error('Internal Error, no results yet');

    return this.results.map((r) => r.exitCode);
  }

  // Return the number of failures that occurred during this recording
  get failures(): number {
    if (!this.results) throw new Error('Internal Error, no results yet');

    return this.exitCodes!.reduce((acc, c) => acc + (c !== 0 ? 1 : 0), 0);
  }

  get output(): string[] {
    if (!this.results) throw new Error('Internal Error, no results yet');

    return this.results.map((r) => r.output);
  }
}
