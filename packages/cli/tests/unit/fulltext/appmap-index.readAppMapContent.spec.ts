import { vol } from 'memfs';
import { readAppMapContent } from '../../../src/fulltext/appmap-index';
import { Metadata } from '@appland/models';

jest.mock('fs/promises', () => require('memfs').promises);

describe('readAppMapContent', () => {
  beforeEach(() => vol.reset());
  afterEach(() => vol.reset());

  it('reads appmap content from index files', async () => {
    const appmapName = '/appmaps/testAppMap';
    const metadata: Metadata = {
      name: 'Test AppMap',
      labels: ['test', 'appmap'],
      exception: { class: 'Exception', message: 'Test exception' },
      client: { name: 'Test client', version: '1.0.0', url: 'http://test.com' },
      recorder: { name: 'Test recorder' },
    };
    const classMap = [
      {
        name: 'package1',
        type: 'package',
        labels: [],
        children: [
          {
            name: 'class1',
            type: 'class',
            labels: [],
            children: [
              {
                name: 'function1',
                type: 'function',
                labels: [],
                children: [],
              },
            ],
          },
          { name: 'class2', type: 'class', labels: [], children: [] },
        ],
      },
      { name: 'query1', type: 'query', labels: [], children: [] },
      { name: 'route1', type: 'route', labels: [], children: [] },
    ];

    vol.fromJSON({
      [`${appmapName}/metadata.json`]: JSON.stringify(metadata),
      [`${appmapName}/classMap.json`]: JSON.stringify(classMap),
      [`${appmapName}/canonical.parameters.json`]: JSON.stringify(['param1', 'param2']),
    });

    const content = await readAppMapContent(`${appmapName}.appmap.json`);
    expect(content).toContain('Test AppMap');
    expect(content).toContain('test');
    expect(content).toContain('appmap');
    expect(content).toContain('Test exception');
    expect(content).toContain('query1');
    expect(content).toContain('route1');
    expect(content).toContain('function1');
    expect(content).toContain('param1');
    expect(content).toContain('param2');
    expect(content).toContain('route');
    expect(content).toContain('sql');
    expect(content).toContain('database');

    expect(content.split(' ')).toEqual([
      'Test',
      'AppMap',
      'test',
      'appmap',
      'Test',
      'exception',
      'query1',
      'package1',
      'class1',
      'function1',
      'class2',
      'route1',
      'param1',
      'param2',
      'sql',
      'query',
      'database',
      'route',
      'request',
      'server',
      'http',
    ]);
  });
});
