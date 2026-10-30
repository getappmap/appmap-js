import { existsSync, statSync } from 'fs';
import { resolve } from 'path';

import sqlite3 from 'better-sqlite3';

import { appmapDirFromConfig } from '../../../lib/appmapDirFromConfig';
import { queryDbPath } from '../db/path';
import { SCHEMA_VERSION } from '../db/schema';
import { openReadOnly } from './openReadOnly';

export interface LazyQueryDbOptions {
  // --appmap-dir; falls back to appmap_dir in ./appmap.yml.
  appmapDir?: string;
  // --query-db; skips appmap dir resolution entirely.
  queryDb?: string;
  // Path of the running appmap binary, when it is one. Suggested commands
  // use it instead of `appmap`: IDEs install the binary in ~/.appmap/bin
  // without always putting it on the PATH, and another `appmap` on the PATH
  // could build the index with a schema this server can't read.
  executable?: string;
}

// Query DB for a long-running server (the MCP) that must start before the
// index exists. `refresh()` retries locating and opening the DB until it
// succeeds; `get()` returns the handle or throws a message telling the
// caller how to fix it. The handle stays open across reindexing, since
// the indexer writes in WAL mode and rebuilds the schema in place, but is
// reopened if the file is deleted or replaced.
export class LazyQueryDb {
  private db?: sqlite3.Database;
  private opened?: { path: string; dev: number; ino: number };
  private appmapDir?: string;
  private error = 'query DB not opened yet';

  constructor(private readonly options: LazyQueryDbOptions) {}

  // Never throws; a failure is recorded and reported by get().
  async refresh(): Promise<void> {
    if (this.db) {
      if (this.isStillOpenFile()) return;
      this.close();
    }

    if (!this.options.queryDb && !this.appmapDir) {
      // unknown: appmap.yml isn't validated, and a non-string would make
      // path functions throw below.
      let appmapDir: unknown = this.options.appmapDir;
      if (!appmapDir) {
        try {
          appmapDir = await appmapDirFromConfig();
        } catch (e) {
          this.error = `Failed to read appmap.yml in ${process.cwd()}: ${
            e instanceof Error ? e.message : String(e)
          }`;
          return;
        }
      }
      if (!appmapDir) {
        this.error =
          `AppMap is not configured in ${process.cwd()}: there is no readable appmap.yml with ` +
          `an appmap_dir, and no --appmap-dir was given to the MCP server. ` +
          `Set up AppMap recording for this project, then run ${this.indexInstructions()}.`;
        return;
      }
      if (typeof appmapDir !== 'string') {
        this.error = `appmap_dir in ${process.cwd()}/appmap.yml must be a directory path, not ${JSON.stringify(
          appmapDir
        )}.`;
        return;
      }
      this.appmapDir = appmapDir;
    }

    const path = this.options.queryDb ?? queryDbPath(this.appmapDir ?? '');
    if (!existsSync(path)) {
      this.error = `No AppMap index found (expected at ${path}). Build it with ${this.indexInstructions()}, or add --watch to keep it updated as new recordings appear.`;
      if (this.appmapDir && !existsSync(resolve(this.appmapDir)))
        this.error += ` Note that the AppMap directory ${resolve(
          this.appmapDir
        )} does not exist yet; record some AppMaps first.`;
      return;
    }

    try {
      this.db = openReadOnly(this.appmapDir ?? '', path);
      const { dev, ino } = statSync(path);
      this.opened = { path, dev, ino };
    } catch (e) {
      this.error = `Failed to open the AppMap index at ${path}: ${
        e instanceof Error ? e.message : String(e)
      }`;
    }
  }

  // Checked on every call rather than once at open: an indexer may be
  // creating, rebuilding or filling the DB while the server runs.
  get(): sqlite3.Database {
    const { db } = this;
    if (!db) throw new Error(this.error);

    const version = db.pragma('user_version', { simple: true }) as number;
    if (version === 0)
      throw new Error(
        `The AppMap index is still being created. Wait for \`appmap index\` to finish, or run ${this.indexInstructions()} if it isn't running.`
      );
    if (version < SCHEMA_VERSION)
      throw new Error(
        `The AppMap index was built by an older version of the appmap CLI (schema v${version}, this server needs v${SCHEMA_VERSION}). Rebuild it with ${this.indexInstructions()}.`
      );
    if (version > SCHEMA_VERSION)
      throw new Error(
        `The AppMap index was built by a newer version of the appmap CLI (schema v${version}, this server understands v${SCHEMA_VERSION}). Upgrade the appmap CLI that runs this MCP server.`
      );

    if (!db.prepare('SELECT 1 FROM appmaps LIMIT 1').get())
      throw new Error(
        `The AppMap index contains no recordings yet. Record some AppMaps` +
          (this.appmapDir ? ` into ${resolve(this.appmapDir)}` : '') +
          `, then run ${this.indexInstructions()} if it isn't already running. Add --watch to keep the index updated.`
      );

    return db;
  }

  close(): void {
    this.db?.close();
    this.db = undefined;
    this.opened = undefined;
  }

  // The exact command that builds this server's DB, so a model with a
  // shell can run it as-is.
  indexCommand(platform = process.platform): string {
    const { executable } = this.options;
    const program = executable && canLeadCommand(executable, platform) ? executable : 'appmap';
    const args = [program, 'index', '-d', process.cwd()];
    if (this.options.appmapDir) args.push('--appmap-dir', this.options.appmapDir);
    if (this.options.queryDb) args.push('--query-db', this.options.queryDb);
    return args.map((arg) => shellQuote(arg, platform)).join(' ');
  }

  // indexCommand() for a message, saying where the binary is when it
  // couldn't be put in the command itself.
  indexInstructions(platform = process.platform): string {
    const command = `\`${this.indexCommand(platform)}\``;
    const { executable } = this.options;
    if (!executable || canLeadCommand(executable, platform)) return command;
    return `${command} (if \`appmap\` isn't on the PATH, it's at ${shellQuote(
      executable,
      platform
    )})`;
  }

  // An indexer only ever rewrites the DB in place, but a user may delete
  // it (e.g. to reset a broken index) and build a new one; the old handle
  // would keep reading the deleted file.
  private isStillOpenFile(): boolean {
    if (!this.opened) return false;
    try {
      const { dev, ino } = statSync(this.opened.path);
      return dev === this.opened.dev && ino === this.opened.ino;
    } catch {
      return false;
    }
  }
}

// PowerShell won't run a quoted first word without a leading `&`, which
// cmd.exe rejects, so on Windows a path that needs quoting can't start a
// command that works in both.
function canLeadCommand(executable: string, platform: NodeJS.Platform): boolean {
  return platform !== 'win32' || shellQuote(executable, platform) === executable;
}

// Quotes for the shell the user most likely has: POSIX sh, or on Windows
// either cmd.exe or PowerShell. Both of those take double quotes, and
// Windows paths can't contain `"` (PowerShell would still expand `$` in
// one, which is rare enough to ignore).
export function shellQuote(arg: string, platform = process.platform): string {
  // Inside quotes, Windows programs read `\"` as an escaped quote, so
  // trailing backslashes are doubled to keep the closing quote.
  if (platform === 'win32')
    return /^[\w\\:./-]+$/.test(arg) ? arg : `"${arg.replace(/\\+$/, '$&$&')}"`;
  if (/^[\w@%+=:,./-]+$/.test(arg)) return arg;
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}
