import { EventEmitter } from 'stream';
import { Glob, IGlob } from 'glob';
import { assert } from 'console';
import { stat } from 'fs/promises';
import { Stats } from 'fs-extra';
import { verbose } from '../utils';

class Globber extends EventEmitter {
  constructor(private pattern: string, public interval = 1000) {
    super();
  }

  private currentGlob?: IGlob;

  public scanNow() {
    assert(!this.currentGlob);
    this.timeout = undefined;
    this.currentGlob = new Glob(this.pattern, {
      ignore: ['**/node_modules/**', '**/.git/**', '**/__pycache__/**'],
      strict: false,
      silent: !verbose(),
    })
      .on('end', this.scanEnd.bind(this))
      .on('match', this.matchFound.bind(this));
  }

  private running = false;
  public start() {
    this.running = true;
    this.scanNow();
  }

  public close() {
    if (this.currentGlob) this.currentGlob.abort();
    if (this.timeout) clearTimeout(this.timeout);

    this.running = false;
    this.currentGlob = undefined;
    this.timeout = undefined;
  }

  timeout?: NodeJS.Timeout;
  private scanEnd(found: string[]) {
    this.currentGlob = undefined;

    const files = new Set(found);
    for (const f of this.mtimes.keys()) {
      if (!files.has(f)) this.remove(f);
    }

    this.emit('end');

    if (this.running) this.timeout = setTimeout(this.scanNow.bind(this), this.interval);
  }

  private matchFound(file: string) {
    stat(file).then(
      (stat) => this.update(file, stat),
      () => this.remove(file)
    );
  }

  private mtimes = new Map<string, number>();

  private update(file: string, { mtimeMs }: Stats) {
    const oldTime = this.mtimes.get(file);

    if (oldTime === mtimeMs) return;

    this.mtimes.set(file, mtimeMs);

    const event = oldTime ? 'change' : 'add';
    this.emit(event, file);
  }

  private remove(file: string) {
    {
      this.mtimes.delete(file);
      this.emit('unlink', file);
    }
  }
}

interface Globber {
  on(event: 'end', listener: () => void): this;
  on(event: 'add' | 'change' | 'unlink', listener: (path: string) => void): this;
  emit(event: 'end'): boolean;
  emit(event: 'add' | 'change' | 'unlink', path: string): boolean;
}

export default Globber;
