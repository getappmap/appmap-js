import buildAppMap from '../../src/appMapBuilder';
import AppMapFilter from '../../src/appMapFilter';
import scenarioData from './fixtures/checkout_update_payment.appmap.json';

const appMap = buildAppMap().source(scenarioData).build();

describe('appMapFilter', () => {
  let filter;

  beforeAll(() => expect(appMap.classMap.roots.map((co) => co.id)).toContain('openssl'));
  beforeEach(() => (filter = new AppMapFilter()));

  describe('by name', () => {
    it('can be a package name', () => {
      filter.declutter.hideName.on = true;
      filter.declutter.hideName.names = ['package:openssl'];
      const filteredAppMap = filter.filter(appMap);

      expect(filteredAppMap.classMap.roots.map((co) => co.id)).not.toContain('openssl');
    });

    it('can be a regexp', () => {
      filter.declutter.hideName.on = true;
      filter.declutter.hideName.names = ['/^package:openssl$/'];
      const filteredAppMap = filter.filter(appMap);

      expect(filteredAppMap.classMap.roots.map((co) => co.id)).not.toContain('openssl');
    });
  });

  describe('by location', () => {
    it('can remove external paths', () => {
      expect(appMap.classMap.search('CallbackSequence#invoke_before')).toHaveLength(1);

      filter.declutter.hideExternalPaths.on = true;
      const filteredAppMap = filter.filter(appMap);

      expect(filteredAppMap.classMap.search('CallbackSequence#invoke_before')).toHaveLength(0);
    });
  });

  describe('by elapsed time', () => {
    it('removes function events below a threshold', () => {
      const allPackageNames = new Set();
      appMap.classMap.visit((co) => allPackageNames.add(co.id));

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
});
