import { executeCommand } from '../../lib/executeCommand';
import { default as openAPICmd } from '../openapi';
import { DefaultMaxAppMapSizeInMB } from '../../lib/fileSizeFilter';
import FingerprintDirectoryCommand from '../../fingerprint/fingerprintDirectoryCommand';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

export default async function analyzeArchive(revision: string, dir: string): Promise<void> {
  const analyzer = new ArchiveAnalyzer(revision, dir);
  return analyzer.analyze();
}

const ScanConfigFile = [
  '../../../resources/compare-scanner.yml', // As packaged
  '../../../../resources/compare-scanner.yml', // In development
]
  .map((fileName) => join(__dirname, fileName))
  .find((fileName) => existsSync(fileName));

class ArchiveAnalyzer {
  constructor(public readonly revision: string, public readonly dir: string) {}

  async analyze() {
    await this.checkout();
    await this.inWorkingDirectory(this.dir, async () => {
      await this.index();
      await this.openAPI();
      await this.runtimeAnalysis();
    });
  }

  private async checkout() {
    await executeCommand(`git checkout ${this.revision}`);
  }

  private async index() {
    await new FingerprintDirectoryCommand('.').execute();
  }

  private async openAPI() {
    await openAPICmd.handler({
      appmapDir: '.',
      outputFile: 'openapi.yml',
      maxSize: DefaultMaxAppMapSizeInMB,
    });
  }

  private async runtimeAnalysis() {
    await executeCommand(
      `npx @appland/scanner@latest scan --appmap-dir . --config ${ScanConfigFile} --all`,
      true,
      true,
      true
    );
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
