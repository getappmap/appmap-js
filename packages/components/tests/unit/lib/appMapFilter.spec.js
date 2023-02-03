import AppMapFilter from '@/lib/appMapFilter';
import defaultScenario from '@/stories/data/scenario.json';
import { buildAppMap } from '@appland/models';

describe('appMapFilter', () => {
  it('filters out a package', () => {
    const appmap = buildAppMap(defaultScenario).build();
    expect(appmap.events.length).toEqual(500);
    expect(appmap.classMap.codeObjects.map(co => co.fqid)).toContain('package:json');
    const filter = new AppMapFilter();
    filter.declutter.hideName = {
      on: true,
      names: ['package:json'],
    };
    const filteredAppMap = filter.filter(appmap);
    expect(filteredAppMap.events.length).toEqual(428);
    expect(filteredAppMap.classMap.codeObjects.map(co => co.fqid)).not.toContain('package:json');
  });
});
