import buildAppMap from '../../src/appMapBuilder';
import AppMapFilter from '../../src/appMapFilter';
import checkoutUpdatePaymentData from './fixtures/checkout_update_payment.appmap.json';
import petClinicData from './fixtures/org_springframework_samples_petclinic_web_VisitControllerTests_testShowVisits.appmap.json';
import listMicropostsCompactData from './fixtures/list_microposts_compact.appmap.json';
import modelData from './fixtures/appland/DAO_Scenario_validation_fails_when_raw_data_is_larger_than_limit.appmap.json';

import loadPetWithVisit from './fixtures/appMapFilter/loadPetWithVisit.appmap.json';
import loadPetWithVisit_depth_1 from './fixtures/appMapFilter/loadPetWithVisit_depth_1.appmap.json';
import listMicropostsCompactAppMap_sql_context from './fixtures/appMapFilter/listMicropostsCompactAppMap_sql_context.appmap.json';
import { writeFileSync } from 'fs';

const checkoutUpdatePaymentAppMap = buildAppMap().source(checkoutUpdatePaymentData).build();
const petClinicAppMap = buildAppMap().source(petClinicData).build();
const listMicropostsCompactAppMap = buildAppMap().source(listMicropostsCompactData).build();
const modelAppMap = buildAppMap().source(modelData).build();

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

  describe('hideTree', () => {
    it('can be a package name', () => {
      filter.declutter.hideTree.on = true;
      filter.declutter.hideTree.names = ['package:actionpack'];
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

  describe('context events', () => {
    it('can be applied', () => {
      const functionId =
        'function:org/springframework/samples/petclinic/web/VisitController#loadPetWithVisit';
      filter.declutter.context.on = true;
      filter.declutter.context.names = [functionId];

      delete petClinicAppMap.metadata['fingerprints'];

      const filteredAppMap = filter.filter(petClinicAppMap);
      expect(JSON.stringify(filteredAppMap, null, 2)).toEqual(
        JSON.stringify(loadPetWithVisit_depth_1, null, 2)
      );
    });
    it('depth can be configured', () => {
      const functionId =
        'function:org/springframework/samples/petclinic/web/VisitController#loadPetWithVisit';
      filter.declutter.context.on = true;
      filter.declutter.context.names = [functionId];
      filter.declutter.context.depth = 3;

      delete petClinicAppMap.metadata['fingerprints'];

      const filteredAppMap = filter.filter(petClinicAppMap);
      expect(JSON.stringify(filteredAppMap, null, 2)).toEqual(
        JSON.stringify(loadPetWithVisit, null, 2)
      );
    });
    it('can apply to SQL', () => {
      const functionId = 'query:DELETE FROM "microposts" WHERE "microposts"."id" = ?';
      filter.declutter.context.on = true;
      filter.declutter.context.names = [functionId];

      const filteredAppMap = filter.filter(listMicropostsCompactAppMap);
      expect(JSON.stringify(filteredAppMap, null, 2)).toEqual(
        JSON.stringify(listMicropostsCompactAppMap_sql_context, null, 2)
      );
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

    it('recognizes ROOT_EVENT_LABELS', () => {
      const augmentedModelData = { ...modelData };
      const validateFunction = augmentedModelData.classMap[0].children[0].children[0].children[1];
      expect(validateFunction.name).toEqual('validate');
      validateFunction.labels = ['job.perform'];
      const augmentedModelAppMap = buildAppMap().source(augmentedModelData).build();
      filter.declutter.limitRootEvents.on = true;
      const filteredAppMap = filter.filter(augmentedModelAppMap);
      expect(filteredAppMap.events.length).toEqual(8);
    });

    it('is a nop if there are no "commands" in the AppMap', () => {
      const eventCount = modelAppMap.events.length;
      expect(eventCount).toEqual(10);
      filter.declutter.limitRootEvents.on = true;
      const filteredAppMap = filter.filter(modelAppMap);
      expect(filteredAppMap.events.length).toEqual(10);
    });
  });
});
