import { CodeObject, Event } from '@appland/models';
import { cloneEvent, cloneCodeObject } from '../src/eventUtil';
import { fixtureAppMap } from './util';

describe('eventUtil', () => {
  describe('cloneEvent', () => {
    it('provides access to expected values', async () => {
      const appmap = await fixtureAppMap(
        'org_springframework_samples_petclinic_owner_OwnerControllerTests_testInitCreationForm.appmap.json'
      );
      const expected = appmap.events.find((e) => e.isCall()) as Event;
      const subject = cloneEvent(expected);

      expect(subject.id).toEqual(expected.id);
      expect(subject.definedClass).toEqual(expected.definedClass);
      expect(subject.codeObject.fqid).toEqual(expected.codeObject.fqid);
      expect(subject.linkedEvent.id).toEqual(expected.linkedEvent.id);
      expect(subject.ancestors()).toEqual([]);
      expect(subject.descendants()).toEqual([]);
      expect(JSON.stringify(subject)).toEqual(JSON.stringify(expected));
    });
  });

  describe('cloneCodeObject', () => {
    it('provides access to expected values', async () => {
      const appmap = await fixtureAppMap(
        'org_springframework_samples_petclinic_owner_OwnerControllerTests_testInitCreationForm.appmap.json'
      );
      const expected = appmap.events.find((e) => e.isCall())?.codeObject as CodeObject;
      const subject = cloneCodeObject(expected) as CodeObject;

      expect(subject.fqid).toEqual(expected.fqid);
      expect(subject.parent).toBeDefined();
      expect(subject.parent?.id).toEqual(expected.parent?.id);
      expect(JSON.stringify(subject)).toEqual(JSON.stringify(expected));
    });
  });
});
