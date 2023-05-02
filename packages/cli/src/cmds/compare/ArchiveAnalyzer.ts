import { executeCommand } from '../../lib/executeCommand';
import { default as openAPICmd } from '../openapi';
import { DefaultMaxAppMapSizeInMB } from '../../lib/fileSizeFilter';
import { join } from 'path';
import { tmpdir } from 'os';
import { pid } from 'process';
import { rm, writeFile } from 'fs/promises';

export default async function analyzeArchive(
  revision: string,
  dir: string,
  scannerConfig: string | undefined
): Promise<void> {
  const analyzer = new ArchiveAnalyzer(revision, dir, scannerConfig);
  return analyzer.analyze();
}

class ArchiveAnalyzer {
  constructor(
    public readonly revision: string,
    public readonly dir: string,
    public readonly scannerConfig?: string
  ) {}

  async analyze() {
    await this.checkout();
    await this.inWorkingDirectory(this.dir, async () => {
      await this.openAPI();
      await this.runtimeAnalysis();
    });
  }

  private async checkout() {
    await executeCommand(`git checkout ${this.revision}`);
  }

  private async openAPI() {
    await openAPICmd.handler({
      appmapDir: '.',
      outputFile: 'openapi.yml',
      maxSize: DefaultMaxAppMapSizeInMB,
    });
  }

  private async runtimeAnalysis() {
    let command = `npx @appland/scanner@latest scan --appmap-dir . --all`;
    let scannerConfigFile: string | undefined;
    if (this.scannerConfig) {
      scannerConfigFile = join(tmpdir(), `scanner-config-${pid}.yml`);
      await writeFile(scannerConfigFile, this.scannerConfig, 'utf-8');
      command += ` -c ${scannerConfigFile}`;
    }
    try {
      await executeCommand(command, true, true, true);
    } finally {
      if (scannerConfigFile) await rm(scannerConfigFile, { force: true });
    }
  }

  private async inWorkingDirectory<T>(dir: string, fn: () => Promise<T>) {
    const cwd = process.cwd();
    process.chdir(dir);
    try {
      await fn();
    } finally {
      process.chdir(cwd);
    }
  }
}
