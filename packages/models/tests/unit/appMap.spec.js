import buildAppMap from '../../src/appMapBuilder';
import scenario from '../../../components/tests/unit/fixtures/large_scenario.json';

describe('AppMap', () => {
  const appMap = buildAppMap().source(scenario).normalize().build();

  test('version', () => {
    expect(appMap.version).toEqual('1.2');
  });

  test('metadata', () => {
    expect(appMap.metadata.language.name).toEqual('java');
  });

  test('name', () => {
    expect(appMap.name).toEqual('Curator master elect single master');
  });

  test('event tree', () => {
    expect(appMap.rootEvent.count()).toEqual(409);
  });

  test('serialization', () => {
    expect(() => JSON.stringify(appMap)).not.toThrow();
  });

  test('getEvent', () => {
    for (let i = 0; i < appMap.events.length; i += 1) {
      expect(appMap.getEvent(i + 1)).toEqual(appMap.events[i]);
    }
  });
});
