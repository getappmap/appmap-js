import { serializeFilter } from '@appland/models';
import buildFilter from '../../../src/cmds/archive/buildFilter';
import { HideOption } from '../../../src/lib/loadAppMapConfig';

describe('buildFilter', () => {
  const language = 'ruby';

  it('builds default filter', () => {
    const compareFilter = {};
    const filter = buildFilter(language, compareFilter);

    expect(serializeFilter(filter)).toEqual({
      hideExternalPaths: ['node_modules', 'vendor'],
      hideName: [
        '/^external-route:.*\\bhttp:\\/\\/127\\.0\\.0\\.1:\\d+\\/session\\/[a-f0-9]{32,}\\//',
        '/^function:.*\\.included$/',
        '/^query:PRAGMA\\b/',
        '/^query:SAVEPOINT\\b/',
        '/^query:SHOW\\b/',
        '/^query:[\\s\\S]*\\bPRAGMA\\b/',
        '/^query:[\\s\\S]*\\bSAVEPOINT\\b/',
        '/^query:[\\s\\S]*\\bpg_attribute\\b/',
        '/^query:[\\s\\S]*\\bsqlite_master\\b/',
      ],
    });
  });

  it('can enable a specific filter only', () => {
    const compareFilter = { hide_external: false, hide: ['sql_pragma'] as HideOption[] };
    const filter = buildFilter(language, compareFilter);

    expect(serializeFilter(filter)).toEqual({
      hideName: ['/^query:PRAGMA\\b/', '/^query:[\\s\\S]*\\bPRAGMA\\b/'],
    });
  });
});
