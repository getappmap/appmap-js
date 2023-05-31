import { CommandModule } from 'yargs';
import * as path from 'path';
import { promises as fs } from 'fs';
import { homedir } from 'os';
import GithubRelease from '../lib/githubRelease';
import { isFile } from '../utils';
import { execSync } from 'child_process';

const agentPath = path.dirname(require.resolve('@appland/appmap-agent-js'));
const jsLoader = path.join(agentPath, 'server.mjs');
const appmapPath = path.join(homedir(), '.appmap');

interface ExecDependency {
  path: string;
  update: () => Promise<void> | void;
}

class JavaUpdater implements ExecDependency {
  private _path = '';

  get path(): string {
    return this._path;
  }

  async update() {
    const release = new GithubRelease('getappmap', 'appmap-java');
    const assets = await release.getLatestAssets();
    const asset = assets.find((a) => a.content_type === 'application/java-archive');
    if (!asset) {
      throw new Error('Could not retrieve latest Java agent release');
    }

    this._path = path.join(appmapPath, asset.name);
    if (await isFile(this._path)) {
      return;
    }

    console.log(`Downloading AppMap Java agent ${asset.name}`);
    await GithubRelease.downloadAsset(asset, this._path);
  }
}
const dependencies = {
  java: new JavaUpdater(),
};

export default {
  command: 'exec',
  describe: 'Execute a command with AppMap enabled',
  builder(yargs) {
    return yargs.option('cwd', {
      type: 'string',
      default: process.cwd(),
      description: 'Working directory for the command',
    });
  },
  async handler(args) {
    await fs.mkdir(appmapPath, { recursive: true });
    await Promise.all(Object.values(dependencies).map((dep) => dep.update()));

    const command = args._.slice(1).join(' ');
    execSync(command, {
      stdio: 'inherit',
      cwd: args['cwd'] as string,
      env: {
        ...process.env,
        APPMAP: 'true',
        DISABLE_SPRING: 'true',
        RUBYOPT: '-r./src/exec-bootstrap/bootstrap.rb',
        PYTHONSTARTUP: './src/exec-bootstrap/bootstrap.py',
        JAVA_TOOL_OPTIONS: [`-javaagent:${dependencies.java.path}`, process.env.JAVA_TOOL_OPTIONS]
          .filter(Boolean)
          .join(' '),
        NODE_OPTIONS: [
          '--experimental-vm-modules',
          `--require "${path.join(__dirname, '../../src/exec-bootstrap/bootstrap.cjs')}"`,
          process.env.NODE_OPTIONS,
        ]
          .filter(Boolean)
          .join(' '),
      },
    });
    process.exitCode = 0;
  },
} as CommandModule;
