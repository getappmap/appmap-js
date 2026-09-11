import yargs from 'yargs';
import { log } from 'console';

import { handleWorkingDirectory } from '../../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../../lib/locateAppMapDir';
import { verbose } from '../../../utils';
import { openReadOnly } from '../lib/openReadOnly';
import { truncationFooter } from '../lib/page';
import {
  find,
  FindType,
  FindAppmapRow,
  FindCallRow,
  FindExceptionRow,
  FindLogRow,
  FindQueryRow,
  FindRequestRow,
} from '../queries/find';
import { formatMs, formatTable } from '../lib/format';
import { projectLogMessage } from '../lib/logMessage';
import { buildFindFilter } from './find';
import type { Argv } from './find';

export default async function handler(argvIn: yargs.ArgumentsCamelCase<unknown>): Promise<void> {
  const argv = argvIn as yargs.ArgumentsCamelCase<Argv>;
  verbose(argv.verbose as boolean | undefined);
  handleWorkingDirectory(argv.directory);
  const appmapDir = argv.queryDb ? '' : await locateAppMapDir(argv.appmapDir);

  const { type, filter } = buildFindFilter(argv as Record<string, unknown>);

  const db = openReadOnly(appmapDir, argv.queryDb);
  try {
    const page = find(db, type, filter);
    if (argv.json) {
      log(JSON.stringify(page, null, 2));
      return;
    }
    log(renderTable(type, page.rows));
    const footer = truncationFooter(page);
    if (footer) log(footer);
  } finally {
    db.close();
  }
}

function renderTable(type: FindType, rows: unknown[]): string {
  switch (type) {
    case 'appmaps':
      return formatTable(
        ['APPMAP', 'ROUTE', 'STATUS', 'ELAPSED', 'SQL', 'BRANCH', 'TIMESTAMP'],
        (rows as FindAppmapRow[]).map((r) => [
          r.appmap_name,
          r.route ?? '',
          r.status_code != null ? String(r.status_code) : '',
          formatMs(r.elapsed_ms),
          String(r.sql_count),
          r.branch ?? '',
          r.timestamp ?? '',
        ])
      );
    case 'requests':
      return formatTable(
        ['APPMAP', 'METHOD', 'ROUTE', 'STATUS', 'ELAPSED', 'BRANCH'],
        (rows as FindRequestRow[]).map((r) => [
          r.appmap_name,
          r.method,
          r.route,
          String(r.status_code),
          formatMs(r.elapsed_ms),
          r.branch ?? '',
        ])
      );
    case 'queries':
      return formatTable(
        ['APPMAP', 'ELAPSED', 'CALLER', 'SQL'],
        (rows as FindQueryRow[]).map((r) => [
          r.appmap_name,
          formatMs(r.elapsed_ms),
          r.caller_class && r.caller_method ? `${r.caller_class}#${r.caller_method}` : '',
          r.sql_text,
        ])
      );
    case 'calls':
      return formatTable(
        ['APPMAP', 'FQID', 'LOCATION', 'ELAPSED', 'PARAMS', 'RETURN'],
        (rows as FindCallRow[]).map((r) => [
          r.appmap_name,
          r.fqid ?? `${r.defined_class}#${r.method_id}`,
          r.path != null ? `${r.path}${r.lineno != null ? `:${r.lineno}` : ''}` : '',
          formatMs(r.elapsed_ms),
          formatParams(r.parameters_json),
          r.return_value ?? '',
        ])
      );
    case 'exceptions': {
      const exRows = rows as FindExceptionRow[];
      const withLogs = exRows.some((r) => r.recent_logs !== undefined);
      const headers = withLogs
        ? ['APPMAP', 'CLASS', 'MESSAGE', 'EVENT', 'LOGS']
        : ['APPMAP', 'CLASS', 'MESSAGE', 'EVENT'];
      return formatTable(
        headers,
        exRows.map((r) => {
          const base = [r.appmap_name, r.exception_class, r.message ?? '', String(r.event_id)];
          if (withLogs) base.push(String(r.recent_logs?.length ?? 0));
          return base;
        })
      );
    }
    case 'logs':
      return formatTable(
        ['APPMAP', 'LOGGER', 'METHOD', 'MESSAGE', 'EVENT'],
        (rows as FindLogRow[]).map((r) => [
          r.appmap_name,
          r.logger,
          r.method_id,
          projectLogMessage(r.parameters_json, r.return_value),
          String(r.event_id),
        ])
      );
  }
}


function formatParams(json: string | null): string {
  if (!json) return '';
  try {
    const parsed = JSON.parse(json) as { name?: string; value?: unknown }[];
    return parsed
      .map((p) => `${p.name ?? '?'}=${typeof p.value === 'string' ? p.value : JSON.stringify(p.value)}`)
      .join(', ');
  } catch {
    return json;
  }
}
