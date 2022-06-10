import { buildAppMap } from '@appland/models';
import { assert } from 'console';
import EventEmitter from 'events';
import { readFile } from 'fs/promises';
import AppMapIndex from '../../../appMapIndex';
import Check from '../../../check';
import RuleChecker from '../../../ruleChecker';
import { Finding } from '../../../types';
import { Breakpoint } from '../breakpoint';
import InteractiveProgress from './interactiveProgess';

export default class ScanContext extends EventEmitter {
  progress: InteractiveProgress;
  checker: RuleChecker;
  breakpoint?: Breakpoint;
  isScanning = false;

  constructor(public checks: Check[], public files: string[]) {
    super();

    this.progress = new InteractiveProgress();
    this.checker = new RuleChecker(this.progress);

    this.progress.on('breakpoint', (breakpoint: Breakpoint) => {
      this.emit('breakpoint', breakpoint);
    });
  }

  scan(): void {
    if (this.isScanning) {
      this.progress.resume();
    } else {
      this.progress.initialize();
      this.doScan();
    }
  }

  protected async doScan(): Promise<void> {
    assert(!this.isScanning, 'Scanning already in progress');

    this.isScanning = true;
    const findings: Finding[] = [];
    for (let fileIndex = 0; fileIndex < this.files.length; fileIndex++) {
      const fileName = this.files[fileIndex];
      const appMapData = await readFile(fileName, 'utf8');
      const appMap = buildAppMap(appMapData).normalize().build();
      const appMapIndex = new AppMapIndex(appMap);
      await this.progress.beginAppMap(fileName, appMap);
      for (let checkIndex = 0; checkIndex < this.checks.length; checkIndex++) {
        const check = this.checks[checkIndex];

        await this.progress.beginCheck(check);
        await this.checker.check(fileName, appMapIndex, check, findings);
        await this.progress.endCheck();
      }
      await this.progress.endAppMap();
    }
    this.isScanning = false;

    this.emit('complete', findings);
  }
}
