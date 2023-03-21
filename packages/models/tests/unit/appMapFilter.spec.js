import buildAppMap from '../../src/appMapBuilder';
import AppMapFilter from '../../src/appMapFilter';
import checkoutUpdatePaymentData from './fixtures/checkout_update_payment.appmap.json';
import petClinicData from './fixtures/org_springframework_samples_petclinic_web_VisitControllerTests_testShowVisits.appmap.json';

const checkoutUpdatePaymentAppMap = buildAppMap().source(checkoutUpdatePaymentData).build();
const petClinicAppMap = buildAppMap().source(petClinicData).build();

describe('appMapFilter', () => {
  let filter;

  beforeAll(() =>
    expect(checkoutUpdatePaymentAppMap.classMap.roots.map((co) => co.id)).toContain('openssl')
  );
  beforeEach(() => (filter = new AppMapFilter()));

  describe('hideName', () => {
    it('can be a package name', () => {
      filter.declutter.hideName.on = true;
      filter.declutter.hideName.names = ['package:openssl'];
      const filteredAppMap = filter.filter(checkoutUpdatePaymentAppMap);

      expect(filteredAppMap.classMap.roots.map((co) => co.id)).not.toContain('openssl');
    });

    it('can be a regexp', () => {
      filter.declutter.hideName.on = true;
      filter.declutter.hideName.names = ['/^package:openssl$/'];
      const filteredAppMap = filter.filter(checkoutUpdatePaymentAppMap);

      expect(filteredAppMap.classMap.roots.map((co) => co.id)).not.toContain('openssl');
    });
  });

  describe('hideExternalPaths', () => {
    it('can be applied', () => {
      expect(
        checkoutUpdatePaymentAppMap.classMap.search('CallbackSequence#invoke_before')
      ).toHaveLength(1);

      filter.declutter.hideExternalPaths.on = true;
      const filteredAppMap = filter.filter(checkoutUpdatePaymentAppMap);

      expect(filteredAppMap.classMap.search('CallbackSequence#invoke_before')).toHaveLength(0);
    });
  });

  describe('hideElapsedTimeUnder', () => {
    it('can be applied', () => {
      const allPackageNames = new Set();
      checkoutUpdatePaymentAppMap.classMap.visit((co) => allPackageNames.add(co.id));

      filter.declutter.hideElapsedTimeUnder.on = true;
      filter.declutter.hideElapsedTimeUnder.time = 5;
      const filteredAppMap = filter.filter(checkoutUpdatePaymentAppMap);

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

  describe('rootEvents', () => {
    it('can be applied to a function', () => {
      const functionId =
        'function:org/springframework/samples/petclinic/web/VisitController#loadPetWithVisit';
      filter.rootObjects = [functionId];
      filter.declutter.limitRootEvents.on = false;

      const filteredAppMap = filter.filter(petClinicAppMap);

      const firstEvent = filteredAppMap.events[0];
      const lastEvent = filteredAppMap.events[filteredAppMap.events.length - 1];

      expect(firstEvent.codeObject.fqid).toEqual(functionId);
      expect(lastEvent.codeObject.fqid).toEqual(functionId);
      expect(filteredAppMap.events.length).toEqual(14);
    });
    it('can be applied to a class', () => {
      const classId = 'class:org/springframework/samples/petclinic/web/VisitController';
      filter.rootObjects = [classId];
      filter.declutter.limitRootEvents.on = false;

      const filteredAppMap = filter.filter(petClinicAppMap);

      const firstEvent = filteredAppMap.events[0];
      const lastEvent = filteredAppMap.events[filteredAppMap.events.length - 1];

      expect(firstEvent.codeObject.parent.fqid).toEqual(classId);
      expect(lastEvent.codeObject.parent.fqid).toEqual(classId);
      expect(filteredAppMap.events.length).toEqual(32);
    });
  });

  describe('limitRootEvents', () => {
    it('can be applied', () => {
      {
        const firstEvent = petClinicAppMap.events[0];
        const lastEvent = petClinicAppMap.events[petClinicAppMap.events.length - 1];
        expect(firstEvent.httpServerRequest).not.toBeTruthy();
        expect(lastEvent.httpServerResponse).not.toBeTruthy();
      }

      filter.declutter.limitRootEvents.on = true;

      const filteredAppMap = filter.filter(petClinicAppMap);
      {
        const firstEvent = filteredAppMap.events[0];
        const lastEvent = filteredAppMap.events[filteredAppMap.events.length - 1];
        expect(firstEvent.isCall()).toBeTruthy();
        expect(firstEvent.httpServerRequest).toBeTruthy();
        expect(lastEvent.isReturn()).toBeTruthy();
        expect(lastEvent.httpServerResponse).toBeTruthy();
      }
    });
  });
});
