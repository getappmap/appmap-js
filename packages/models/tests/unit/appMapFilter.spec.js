import { writeFile } from 'fs/promises';
import buildAppMap from '../../src/appMapBuilder';
import AppMapFilter from '../../src/appMapFilter';
import scenarioData from './fixtures/checkout_update_payment.appmap.json';

const appMap = buildAppMap().source(scenarioData).build();

describe('appMapFilter', () => {
  it('removes openssl package', () => {
    expect(appMap.classMap.roots.map((co) => co.id)).toContain('openssl');

    const filter = new AppMapFilter();
    filter.declutter.hideName.on = true;
    filter.declutter.hideName.names = ['package:openssl'];
    const filteredAppMap = filter.filter(appMap);

    expect(filteredAppMap.classMap.roots.map((co) => co.id)).not.toContain('openssl');
  });

  it('removes function events that have low elapsed time', () => {
    const allPackageNames = new Set();
    appMap.classMap.visit((co) => allPackageNames.add(co.id));

    const filter = new AppMapFilter();
    filter.declutter.hideElapsedTimeUnder.on = true;
    filter.declutter.hideElapsedTimeUnder.time = 5;
    const filteredAppMap = filter.filter(appMap);

    const filteredPackageNames = new Set();
    filteredAppMap.classMap.visit((co) => filteredPackageNames.add(co.id));

    const longEventCount = filteredAppMap.events.filter(
      (e) => e.elapsedTime && e.elapsedTime >= 5 / 1000
    ).length;
    const shortEventCount = filteredAppMap.events.filter(
      (e) => e.elapsedTime && e.elapsedTime < 5 / 1000
    ).length;

    expect(longEventCount).toBeGreaterThan(0);
    expect(shortEventCount).toEqual(0);
    expect(filteredPackageNames.size).toBeLessThan(allPackageNames.size);
  });
});
