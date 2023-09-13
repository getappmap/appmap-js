import { AppMapFilter, FilterState, deserializeFilter } from '@appland/models';
import { CompareFilter, HideOption } from '../../lib/loadAppMapConfig';

export type Language = 'ruby' | 'python' | 'java' | 'javascript';

export const HIDE_OPTIONS: Record<HideOption, RegExp[]> = {
  sql_pragma: [/^query:PRAGMA\b/, /^query:[\s\S]*\bPRAGMA\b/],
  sql_savepoint: [/^query:SAVEPOINT\b/, /^query:[\s\S]*\bSAVEPOINT\b/],
  sql_show: [/^query:SHOW\b/],
  selenium: [/^external-route:.*\bhttp:\/\/127\.0\.0\.1:\d+\/session\/[a-f0-9]{32,}\//],
  pg_metadata: [/^query:[\s\S]*\bpg_attribute\b/],
  sqlite_metadata: [/^query:[\s\S]*\bsqlite_master\b/],
  ruby_included: [/^function:.*\.included$/],
};

export const HIDE_EXTERNAL: Record<Language, boolean> = {
  ruby: true,
  python: true,
  java: false,
  javascript: false,
};

export default function buildFilter(
  language: Language,
  compareFilter: CompareFilter
): AppMapFilter {
  const filterState: FilterState = {};

  const pushHideNames = (names: string[]) => {
    if (!filterState.hideName) filterState.hideName = [];
    filterState.hideName.push(...names);
  };

  let filtersEnabled: HideOption[];
  {
    const hide = compareFilter.hide || (Object.keys(HIDE_OPTIONS) as HideOption[]);
    const reveal = compareFilter.reveal || [];
    filtersEnabled = hide.filter((key) => !reveal?.includes(key));
  }

  for (const item of filtersEnabled) {
    const hideNames = HIDE_OPTIONS[item];
    if (!hideNames) continue;

    pushHideNames(hideNames.map((rexpg) => rexpg.toString()));
  }

  if (compareFilter.hide_name !== undefined) pushHideNames(compareFilter.hide_name);

  filterState.dependencyFolders = compareFilter.dependency_folders;

  if (compareFilter.dependency_folders !== undefined)
    filterState.dependencyFolders = compareFilter.dependency_folders;

  if (compareFilter.hide_external !== undefined) {
    filterState.hideExternal = compareFilter.hide_external;
  } else {
    filterState.hideExternal = HIDE_EXTERNAL[language];
  }

  const filter = deserializeFilter(filterState);

  if (filter.declutter.hideName.names) filter.declutter.hideName.names.sort();
  if (filter.declutter.hideExternalPaths.dependencyFolders)
    filter.declutter.hideExternalPaths.dependencyFolders.sort();

  return filter;
}
