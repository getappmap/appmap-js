import { AppMap, Event } from '@appland/models';
import CommandScope from '../src/scope/commandScope';
import RootScope from '../src/scope/rootScope';
import { Scope } from '../src/types';
import { fixtureAppMap } from './util';

const callEvents = function* (appmap: AppMap): Generator<Event> {
  for (let i = 0; i < appmap.events.length; i++) {
    yield appmap.events[i];
  }
};

describe('scope', () => {
  describe('root', () => {
    it('emits a scope for each root event', async () => {
      const appmap = await fixtureAppMap(
        'org_springframework_samples_petclinic_owner_OwnerControllerTests_testInitCreationForm.appmap.json'
      );
      const scopeGenerator: Generator<Scope> = new RootScope().scopes(callEvents(appmap));
      const scopes: Scope[] = Array.from(scopeGenerator);
      expect(scopes.map((scope) => scope.scope.id)).toEqual([1, 9]);
      expect(scopes.map((scope) => scope.scope.toString())).toEqual([
        'GET /owners/new',
        'org/springframework/samples/petclinic/model/BaseEntity#isNew',
      ]);

      const requestEvents = Array.from(scopes[0].events());
      expect(requestEvents.length).toEqual(4);

      const fnEvents = Array.from(scopes[1].events());
      expect(fnEvents.length).toEqual(1);
    });
  });
  describe('command', () => {
    it('emits http_server_request command with child events', async () => {
      const appmap = await fixtureAppMap(
        'org_springframework_samples_petclinic_owner_OwnerControllerTests_testInitCreationForm.appmap.json'
      );
      const scopeGenerator: Generator<Scope> = new CommandScope().scopes(callEvents(appmap));
      const scopes = Array.from(scopeGenerator);
      expect(scopes.map((scope) => scope.scope.id)).toEqual([1]);
      expect(scopes.map((scope) => scope.scope.toString())).toEqual(['GET /owners/new']);

      const requestEvents = Array.from(scopes[0].events());
      expect(requestEvents.length).toEqual(4);
    });
  });
});
