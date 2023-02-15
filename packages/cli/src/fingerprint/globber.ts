import { assert } from 'console';
import { default as defaultfs } from 'fs';
import { Stats } from 'fs-extra';
import { Glob, IGlob } from 'glob';
import { EventEmitter } from 'stream';
import { verbose } from '@appland/common/src/utils';

class Globber extends EventEmitter {
  private interval: number;
  private fs: typeof defaultfs;
  private statDelayMs: number;

  constructor(
    private pattern: string,
    {
      // This is the default for the constructor. Note that the cli has its own default value.
      statDelayMs = 10,
      interval = 1000,
      fs = defaultfs,
    }: { statDelayMs?: number; interval?: number; fs?: typeof defaultfs } = {}
  ) {
    super();
    this.interval = interval;
    this.fs = fs;
    this.statDelayMs = statDelayMs;
  }

  private currentGlob?: IGlob;

  public scanNow() {
    assert(!this.currentGlob);
    this.timeout = undefined;
    this.currentGlob = new Glob(this.pattern, {
      ignore: ['**/node_modules/**', '**/.git/**'],
      strict: false,
      silent: !verbose(),
      fs: this.fs,
    }).on('end', this.scanEnd.bind(this));
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
  private async scanEnd(found: string[]) {
    this.currentGlob = undefined;

    const files = new Set(found);
    for (const f of this.mtimes.keys()) {
      if (!files.has(f)) this.remove(f);
    }

    for (const file of found) {
      try {
        await this.statFile(file);
        await new Promise((r) => setTimeout(r, this.statDelayMs));
      } catch (e) {
        console.warn(e);
      }
    }
    this.emit('end');

    if (this.running) this.timeout = setTimeout(this.scanNow.bind(this), this.interval);
  }

  private statFile(file: string) {
    return this.fs.promises.stat(file).then(
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
    this.mtimes.delete(file);
    this.emit('unlink', file);
  }
}

interface Globber {
  on(event: 'end', listener: () => void): this;
  on(event: 'add' | 'change' | 'unlink', listener: (path: string) => void): this;
  emit(event: 'end'): boolean;
  emit(event: 'add' | 'change' | 'unlink', path: string): boolean;
}

export default Globber;
