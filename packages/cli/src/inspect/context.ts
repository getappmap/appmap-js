import assert from 'assert';
import EventEmitter from 'events';
import FunctionStats, { default as FunctionStatsImpl } from '../functionStats';
import FindCodeObjects from '../search/findCodeObjects';
import FindEvents from '../search/findEvents';
import { Filter, CodeObjectMatch } from '../search/types';

export default class Context extends EventEmitter {
  public filters: Filter[] = [];
  public saves: string[] = [];
  public stats?: FunctionStats;
  public codeObjectMatches?: CodeObjectMatch[];

  private _codeObjectId: string;

  constructor(public readonly appmapDir: string, codeObjectId: string) {
    super();

    this._codeObjectId = codeObjectId;
  }

  get codeObjectId() {
    return this._codeObjectId;
  }

  set codeObjectId(codeObjectId: string) {
    this._codeObjectId = codeObjectId;
    this.codeObjectMatches = undefined;
    this.stats = undefined;
  }

  async findCodeObjects() {
    const finder = new FindCodeObjects(this.appmapDir, this.codeObjectId);
    this.codeObjectMatches = await finder.find(
      (count) => this.emit('start', count),
      () => this.emit('increment')
    );
    this.emit('stop');
  }

  async buildStats() {
    assert(this.codeObjectMatches, `codeObjectMatches is not yet computed`);

    this.emit('start', this.codeObjectMatches.length);

    const result: any[] = [];
    await Promise.all(
      this.codeObjectMatches.map(async (codeObjectMatch) => {
        const findEvents = new FindEvents(codeObjectMatch.appmap, codeObjectMatch.codeObject);
        findEvents.filter(this.filters);
        const events = await findEvents.matches();
        result.push(...events);
        this.emit('increment');
      })
    );
    this.emit('stop');

    this.emit('collate');
    this.stats = new FunctionStatsImpl(result);
  }

  save() {
    this.saves.push(this.codeObjectId);
  }

  async filter(filter: Filter): Promise<void> {
    this.filters.push(filter);
    await this.buildStats();
  }

  async clearFilters(): Promise<void> {
    this.filters = [];
    await this.buildStats();
  }

  async undoFilter(): Promise<void> {
    if (this.filters.length > 0) {
      this.filters.pop();
    }
    await this.buildStats();
  }
}
